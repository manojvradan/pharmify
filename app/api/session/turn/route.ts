import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ACTOR_EFFORT, ACTOR_MODEL, ACTOR_THINKING, anthropic, anthropicErrorResponse } from "@/lib/anthropic";
import { getCase, getPersona } from "@/lib/cases/bank";
import { AgentId, Turn } from "@/lib/cases/schema";
import { actorMessages, actorSystemPrompt } from "@/lib/session/actor";
import { stripSpeakerLabel } from "@/lib/session/speech";
import { unlockedFacts } from "@/lib/session/factGate";

const Body = z.object({
  caseId: z.string(),
  agent: AgentId,
  transcript: z.array(Turn).min(1).max(200),
});

/**
 * One actor turn. The client sends the whole transcript for this agent; the server
 * re-derives the unlocked facts from it, builds the prompt and streams the reply
 * back as plain text. The unlocked fact ids (never the fact text) go in a header.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { caseId, agent, transcript } = parsed.data;
  const c = getCase(caseId);
  if (!c || !getPersona(c, agent)) return Response.json({ error: "Unknown case or agent" }, { status: 404 });
  if (transcript.at(-1)?.role !== "candidate") {
    return Response.json({ error: "The last turn must be the candidate's" }, { status: 400 });
  }

  const unlocked = unlockedFacts(c, agent, transcript).map((u) => u.factId);

  const stream = anthropic().messages.stream(
    {
      model: ACTOR_MODEL,
      max_tokens: 400, // replies are one to three spoken sentences
      // Latency first: no thinking, lowest effort. The role is narrow and fully scripted.
      thinking: ACTOR_THINKING,
      output_config: { effort: ACTOR_EFFORT },
      cache_control: { type: "ephemeral" },
      system: actorSystemPrompt(c, agent),
      messages: actorMessages(c, agent, transcript),
    },
    { signal: req.signal },
  );

  // Wait for the first event so auth and rate-limit errors come back as JSON,
  // not as a broken stream. The first event arrives with the first token anyway.
  const events = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.MessageStreamEvent>;
  try {
    first = await events.next();
  } catch (err) {
    return anthropicErrorResponse(err, "actor");
  }

  const name = getPersona(c, agent)!.name;
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Hold back the first few tokens until we know whether the reply starts with a speaker label.
        let head: string | null = "";
        for (let r = first; !r.done; r = await events.next()) {
          const event = r.value;
          if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
          if (head === null) {
            controller.enqueue(encoder.encode(event.delta.text));
            continue;
          }
          head += event.delta.text;
          const out = stripSpeakerLabel(head, name);
          if (out !== undefined) {
            if (out) controller.enqueue(encoder.encode(out));
            head = null;
          }
        }
        if (head) controller.enqueue(encoder.encode(stripSpeakerLabel(head, name, true)!));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("Sorry, could you say that again?"));
        }
        controller.close();
      } catch (err) {
        console.error("[actor] stream failed", err);
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Unlocked-Facts": unlocked.join(","),
    },
  });
}
