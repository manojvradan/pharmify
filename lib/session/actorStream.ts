import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { ACTOR_EFFORT, ACTOR_MODEL, ACTOR_THINKING, anthropic } from "@/lib/anthropic";
import { getPersona } from "@/lib/cases/bank";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { actorMessages, actorSystemPrompt } from "./actor";
import { stripSpeakerLabel } from "./speech";

const REFUSAL_LINE = "Sorry, could you say that again?";

export type ActorReply = {
  /** The reply as clean spoken text, chunk by chunk (speaker labels removed). */
  text: AsyncGenerator<string>;
  /** Resolves when the reply is complete, with usage and timing for logging. */
  done: () => Promise<{ text: string; usage: Anthropic.Usage; ttftMs: number | null; durationMs: number; model: string }>;
  abort: () => void;
};

/**
 * Starts one actor turn. Waits for the first stream event before returning, so auth,
 * rate-limit and request errors throw here (and become JSON errors in the route)
 * instead of breaking a stream already sent to the browser.
 */
export async function startActorReply(
  c: CaseRecord,
  agent: AgentId,
  transcript: Turn[],
  signal?: AbortSignal,
): Promise<ActorReply> {
  const persona = getPersona(c, agent);
  if (!persona) throw new Error(`Case ${c.id} has no ${agent}`);

  const startedAt = performance.now();
  const stream = anthropic().messages.stream(
    {
      model: ACTOR_MODEL,
      max_tokens: 400, // replies are one to three spoken sentences
      // Latency first: no thinking. The role is narrow and fully scripted.
      thinking: ACTOR_THINKING,
      output_config: { effort: ACTOR_EFFORT },
      cache_control: { type: "ephemeral" },
      system: actorSystemPrompt(c, agent),
      messages: actorMessages(c, agent, transcript),
    },
    { signal },
  );

  const events = stream[Symbol.asyncIterator]();
  const first = await events.next();

  let full = "";
  let ttftMs: number | null = null;

  async function* text(): AsyncGenerator<string> {
    // Hold back the first few tokens until we know whether the reply starts with a speaker label.
    let head: string | null = "";
    const emit = (s: string) => {
      full += s;
      return s;
    };
    for (let r = first; !r.done; r = await events.next()) {
      const event = r.value;
      if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
      ttftMs ??= performance.now() - startedAt;
      if (head === null) {
        yield emit(event.delta.text);
        continue;
      }
      head += event.delta.text;
      const out = stripSpeakerLabel(head, persona!.name);
      if (out !== undefined) {
        if (out) yield emit(out);
        head = null;
      }
    }
    if (head) yield emit(stripSpeakerLabel(head, persona!.name, true)!);
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") yield emit(REFUSAL_LINE);
  }

  return {
    text: text(),
    done: async () => {
      const final = await stream.finalMessage();
      return { text: full, usage: final.usage, ttftMs, durationMs: performance.now() - startedAt, model: final.model };
    },
    abort: () => stream.abort(),
  };
}
