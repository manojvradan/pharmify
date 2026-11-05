import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Plays the patient and prescriber during the session. Sonnet, not Haiku: in probes on
 * 2026-11-05 Haiku (low and medium effort) often denied or contradicted unlocked facts and
 * invented medicines; Sonnet stayed faithful at about 1.5-2.5 s to first token vs 0.9 s.
 */
export const ACTOR_MODEL = process.env.ACTOR_MODEL ?? "claude-sonnet-5-5";
/** Overridable for latency/accuracy experiments. */
export const ACTOR_EFFORT = (process.env.ACTOR_EFFORT ?? "low") as "low" | "medium" | "high";
/**
 * "No thinking" for the actor. Haiku accepts `disabled`; Sonnet and Opus reject it and
 * take `between_tools`, which also skips thinking before the reply.
 */
export const ACTOR_THINKING = (
  ACTOR_MODEL.includes("haiku") ? { type: "disabled" } : { type: "between_tools" }
) as { type: "disabled" };

/** Separate model that marks the transcript after the session. */
export const GRADER_MODEL = "claude-sonnet-5-5";

let client: Anthropic | undefined;

/** Lazily created so a missing key fails the request, not the build. */
export function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** Maps SDK errors to a short JSON response for the browser. Typed classes, most specific first. */
export function anthropicErrorResponse(err: unknown, label: string): Response {
  if (err instanceof Anthropic.AuthenticationError) {
    return Response.json({ error: "The Anthropic API key is invalid" }, { status: 500 });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Rate limited, try again shortly" }, { status: 429 });
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`[${label}] API error`, err.status, err.message);
    return Response.json({ error: `Model error (${err.status})` }, { status: 502 });
  }
  console.error(`[${label}] failed`, err);
  // Credential resolution fails before any request is sent, so there is no API status to read.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "No Anthropic credentials configured. Set ANTHROPIC_API_KEY." }, { status: 500 });
  }
  return Response.json({ error: "Request failed" }, { status: 500 });
}
