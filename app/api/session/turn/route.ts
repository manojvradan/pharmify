import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { anthropicErrorResponse } from "@/lib/anthropic";
import { getCase, getPersona } from "@/lib/cases/bank";
import { AgentId, type Turn } from "@/lib/cases/schema";
import { startActorReply } from "@/lib/session/actorStream";
import { canTakeTurn, elapsedSeconds } from "@/lib/session/clock";
import { unlockedFacts } from "@/lib/session/factGate";
import { appendTurns, getOwnedSession, loadTranscripts, recordUsage } from "@/lib/session/store";

const Body = z.object({
  sessionId: z.uuid(),
  agent: AgentId,
  text: z.string().trim().min(1).max(2000),
});

/**
 * One candidate turn. The transcript, the clock and the fact gate all come from the
 * server: the browser sends only what the candidate said. The reply streams back as
 * plain text, and both turns are saved when it finishes.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId, agent, text } = parsed.data;

  const session = await getOwnedSession(userId, sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });

  const elapsed = elapsedSeconds(session.startedAt);
  if (!canTakeTurn(elapsed)) return Response.json({ error: "Time is up", ended: true }, { status: 409 });

  const c = getCase(session.caseId);
  const persona = c && getPersona(c, agent);
  if (!c || !persona) return Response.json({ error: "Unknown case or agent" }, { status: 404 });

  // The scripted opening line is shown in the browser when the agent is first opened;
  // record it with the first candidate turn so the transcript is complete.
  const history = (await loadTranscripts(sessionId))[agent];
  const opening: Turn[] = history.length === 0 && persona.openingLine ? [{ role: "actor", text: persona.openingLine, t: elapsed }] : [];
  const candidate: Turn = { role: "candidate", text, t: elapsed };
  const transcript = [...history, ...opening, candidate];
  const unlocked = unlockedFacts(c, agent, transcript);
  const newlyUnlocked = unlocked.filter((u) => u.turnIndex === transcript.length - 1).map((u) => u.factId);

  let reply;
  try {
    reply = await startActorReply(c, agent, transcript, req.signal);
  } catch (err) {
    return anthropicErrorResponse(err, "actor");
  }
  // Saved only once the model has accepted the turn, so a failed call can be retried without duplicates.
  await appendTurns(sessionId, agent, [...opening, { ...candidate, unlockedFactIds: newlyUnlocked }]);

  const encoder = new TextEncoder();
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

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // Lets the browser keep its display timer in step with the server clock.
      "X-Elapsed": String(elapsed),
    },
  });
}
