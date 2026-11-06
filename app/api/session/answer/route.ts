import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getCase } from "@/lib/cases/bank";
import { PART_SECONDS_BY_FORMAT, caseFormat } from "@/lib/cases/format";
import { canTakeTurn, elapsedSeconds } from "@/lib/session/clock";
import { appendTurns, getOwnedSession } from "@/lib/session/store";
import { transcribe, voiceEnabled } from "@/lib/voice/elevenlabs";

/** A one-minute segment of Opus audio is well under this, and under Vercel's 4.5 MB limit. */
const MAX_BYTES = 3 * 1024 * 1024;
/** The last segment is uploaded and transcribed after the clock stops, so allow it time to arrive. */
const UPLOAD_GRACE_SECONDS = 60;

const Fields = z.object({
  sessionId: z.uuid(),
  /** Seconds since the start when this part of the answer began (the browser's clock, checked below). */
  t: z.coerce.number().int().min(0),
  text: z.string().trim().max(4000).optional(),
});

/**
 * Saves one part of a spoken or typed answer to an ethical or legal case. The browser
 * sends the answer in short segments as the candidate talks, so a dropped upload loses
 * a few seconds, not the whole answer. Audio is transcribed and not stored. Each part
 * is saved as a candidate turn, and the grader reads them in order.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const parsed = Fields.safeParse({
    sessionId: form?.get("sessionId"),
    t: form?.get("t"),
    text: form?.get("text") ?? undefined,
  });
  const audio = form?.get("audio");
  if (!parsed.success || (!parsed.data.text && !(audio instanceof Blob))) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (audio instanceof Blob && audio.size > MAX_BYTES) {
    return Response.json({ error: "That part of the answer was too long to send" }, { status: 413 });
  }

  const session = await getOwnedSession(userId, parsed.data.sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });
  const c = getCase(session.caseId);
  if (!c) return Response.json({ error: "Unknown case" }, { status: 404 });
  const format = caseFormat(c.category);
  if (format !== "explain") return Response.json({ error: "This case is a role play" }, { status: 400 });

  const elapsed = elapsedSeconds(session.startedAt);
  const limit = PART_SECONDS_BY_FORMAT[format];
  if (!canTakeTurn(elapsed, limit, UPLOAD_GRACE_SECONDS)) {
    return Response.json({ error: "Time is up", ended: true }, { status: 409 });
  }

  let text = parsed.data.text ?? "";
  if (!text && audio instanceof Blob) {
    if (!voiceEnabled()) return Response.json({ error: "Voice is off" }, { status: 404 });
    if (audio.size === 0) return Response.json({ text: "" });
    try {
      text = await transcribe(audio, req.signal);
    } catch (err) {
      console.error("[answer] speech-to-text failed", err);
      return Response.json({ error: "Couldn't transcribe part of your answer" }, { status: 502 });
    }
  }
  if (!text) return Response.json({ text: "" });

  // Never earlier than 0 or later than the server clock (or the end of the part).
  const t = Math.min(parsed.data.t, elapsed, limit);
  // The explanation is stored in the "patient" conversation: the turns table has no third
  // agent, and explain cases have no characters, so nothing else ever lands there.
  await appendTurns(session.id, "patient", [{ role: "candidate", text, t }]);
  return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
}
