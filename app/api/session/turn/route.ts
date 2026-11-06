import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { anthropicErrorResponse } from "@/lib/anthropic";
import { getCase, getPersona, toPublic } from "@/lib/cases/bank";
import { caseFormat } from "@/lib/cases/format";
import { AgentId, type Turn } from "@/lib/cases/schema";
import { startActorReply } from "@/lib/session/actorStream";
import { canTakeTurn, elapsedSeconds } from "@/lib/session/clock";
import { unlockedFacts } from "@/lib/session/factGate";
import { appendTurns, getOwnedSession, loadTranscripts, recordUsage } from "@/lib/session/store";
import { AGENT_TICKET_HEADER } from "@/lib/voice/agentTicket.shared";
import { verifyAgentTicket } from "@/lib/voice/agentTicket";
import { openSpeechStream, voiceEnabled, type SpeechStream } from "@/lib/voice/elevenlabs";
import type { TurnEvent } from "@/lib/voice/format";

const Body = z.object({
  sessionId: z.uuid(),
  agent: AgentId,
  text: z.string().trim().min(1).max(2000),
  /** Also stream the character's voice, in the same response, as the reply is written. */
  voice: z.boolean().optional(),
});

/**
 * One candidate turn. The transcript, the clock and the fact gate all come from the
 * server: the browser sends only what the candidate said. The reply streams back as
 * plain text, and both turns are saved when it finishes.
 *
 * With `voice`, the response is NDJSON instead (see TurnEvent): reply text and the
 * character's audio interleaved, with the audio starting at the first clause rather than
 * after the whole reply and a second request.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  // The hands-free voice agent has no Clerk cookie: it sends a ticket for this one session instead.
  const ticket = req.headers.get(AGENT_TICKET_HEADER);
  const userId =
    ticket && parsed.success ? verifyAgentTicket(ticket, parsed.data.sessionId) : (await auth()).userId;
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId, agent, text } = parsed.data;

  // In parallel to save a round trip; the history is only used once ownership is confirmed.
  const [session, transcripts] = await Promise.all([getOwnedSession(userId, sessionId), loadTranscripts(sessionId)]);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });

  const elapsed = elapsedSeconds(session.startedAt);
  if (!canTakeTurn(elapsed)) return Response.json({ error: "Time is up", ended: true }, { status: 409 });

  const c = getCase(session.caseId);
  const persona = c && getPersona(c, agent);
  if (!c || !persona) return Response.json({ error: "Unknown case or agent" }, { status: 404 });
  // Ethical and legal cases are a spoken answer with no one to reply (see /api/session/answer).
  if (caseFormat(c.category) !== "roleplay") return Response.json({ error: "This case has no role play" }, { status: 400 });

  // The scripted opening line is shown in the browser when the agent is first opened;
  // record it with the first candidate turn so the transcript is complete.
  const history = transcripts[agent];
  const opening: Turn[] = history.length === 0 && persona.openingLine ? [{ role: "actor", text: persona.openingLine, t: elapsed }] : [];
  const candidate: Turn = { role: "candidate", text, t: elapsed };
  const transcript = [...history, ...opening, candidate];
  const unlocked = unlockedFacts(c, agent, transcript);
  const newlyUnlocked = unlocked.filter((u) => u.turnIndex === transcript.length - 1).map((u) => u.factId);

  // Opened before the model call so the connection is ready when the first words arrive.
  const voice = parsed.data.voice && voiceEnabled() ? toPublic(c).agents.find((a) => a.id === agent)?.voice : undefined;
  const speech: SpeechStream | null = voice ? openSpeechStream(voice) : null;

  let reply;
  try {
    reply = await startActorReply(c, agent, transcript, req.signal);
  } catch (err) {
    speech?.close();
    return anthropicErrorResponse(err, "actor");
  }
  // Saved only once the model has accepted the turn, so a failed call can be retried without duplicates.
  await appendTurns(sessionId, agent, [...opening, { ...candidate, unlockedFactIds: newlyUnlocked }]);

  const encoder = new TextEncoder();
  const headers = {
    "Cache-Control": "no-store",
    // Lets the browser keep its display timer in step with the server clock.
    "X-Elapsed": String(elapsed),
  };

  if (!speech) {
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of reply.text) controller.enqueue(encoder.encode(chunk));
          const done = await reply.done();
          await appendTurns(sessionId, agent, [{ role: "actor", text: done.text, t: elapsed }]);
          await recordUsage(userId, sessionId, [{ kind: "actor", ...done }]);
          controller.close();
        } catch (err) {
          console.error("[actor] stream failed", err);
          controller.error(err);
        }
      },
      cancel() {
        reply.abort();
      },
    });
    return new Response(body, { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
  }

  let closed = false; // set once the stream is closed or the browser has gone
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: TurnEvent) => {
        if (!closed) controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      };
      let audioSent = false;
      const audio = (async () => {
        for await (const pcm of speech.audio) {
          audioSent = true;
          emit({ a: pcm.toString("base64") });
        }
      })();
      try {
        for await (const chunk of reply.text) {
          emit({ t: chunk });
          speech.say(chunk);
        }
        speech.end();
        const done = await reply.done();
        // Saved before the audio finishes, so grading never waits on the voice.
        await appendTurns(sessionId, agent, [{ role: "actor", text: done.text, t: elapsed }]);
        await recordUsage(userId, sessionId, [{ kind: "actor", ...done }]);
        await audio;
        // The browser falls back to /api/session/speak if no audio came through.
        if (speech.failed() && !audioSent) emit({ voiceError: true });
        closed = true;
        controller.close();
      } catch (err) {
        console.error("[actor] stream failed", err);
        speech.close();
        closed = true;
        controller.error(err);
      }
    },
    cancel() {
      closed = true;
      reply.abort();
      speech.close();
    },
  });
  return new Response(body, { headers: { ...headers, "Content-Type": "application/x-ndjson; charset=utf-8" } });
}
