import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getOwnedSession } from "@/lib/session/store";
import { realtimeTranscriptionToken, REALTIME_STT_URL, voiceEnabled } from "@/lib/voice/elevenlabs";

const Body = z.object({ sessionId: z.uuid() });

/**
 * A single-use token for live transcription, so "hold to speak" can stream the microphone
 * straight to ElevenLabs and have the words ready the moment the button is let go.
 * Only for the owner of a live session; the API key never reaches the browser.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  if (!voiceEnabled()) return Response.json({ error: "Voice is off" }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const session = await getOwnedSession(userId, parsed.data.sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });

  try {
    const token = await realtimeTranscriptionToken(req.signal);
    return Response.json({ url: REALTIME_STT_URL + encodeURIComponent(token) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[voice] live transcription token failed", err);
    return Response.json({ error: "Live transcription is unavailable" }, { status: 502 });
  }
}
