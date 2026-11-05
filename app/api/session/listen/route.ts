import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getOwnedSession } from "@/lib/session/store";
import { transcribe, voiceEnabled } from "@/lib/voice/elevenlabs";

/** About two minutes of Opus audio; well under Vercel's 4.5 MB request limit. */
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Transcribes one "hold to speak" answer. The text comes back to the browser, which
 * sends it as a normal turn, so the transcript and fact gate work the same as typing.
 * Audio is passed straight to ElevenLabs and not stored.
 */
export async function POST(req: Request) {
  // auth() first: it reads the request, so this runs per request instead of being prerendered at build.
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  if (!voiceEnabled()) return Response.json({ error: "Voice is off" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const sessionId = z.uuid().safeParse(form?.get("sessionId"));
  const audio = form?.get("audio");
  if (!sessionId.success || !(audio instanceof Blob)) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (audio.size === 0) return Response.json({ text: "" });
  if (audio.size > MAX_BYTES) return Response.json({ error: "That answer was too long to send in one go" }, { status: 413 });

  const session = await getOwnedSession(userId, sessionId.data);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });

  try {
    return Response.json({ text: await transcribe(audio, req.signal) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[voice] speech-to-text failed", err);
    return Response.json({ error: "Couldn't hear that. Try again, or type instead." }, { status: 502 });
  }
}
