import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getCase, getPersona, toPublic } from "@/lib/cases/bank";
import { AgentId } from "@/lib/cases/schema";
import { getOwnedSession, loadTranscripts } from "@/lib/session/store";
import { speak, voiceEnabled } from "@/lib/voice/elevenlabs";

const Query = z.object({ sessionId: z.uuid(), agent: AgentId });

/**
 * Speaks the character's latest line, as streamed MP3, so an <audio> element can start
 * playing before it has all arrived. The server picks the text (the last saved actor turn,
 * or the scripted opening line), so this can't be used to voice arbitrary text.
 */
export async function GET(req: Request) {
  // auth() first: it reads the request, so this runs per request instead of being prerendered at build.
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  if (!voiceEnabled()) return Response.json({ error: "Voice is off" }, { status: 404 });

  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId, agent } = parsed.data;

  const session = await getOwnedSession(userId, sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended" }, { status: 409 });
  const c = getCase(session.caseId);
  const persona = c && getPersona(c, agent);
  const voice = c && toPublic(c).agents.find((a) => a.id === agent)?.voice;
  if (!c || !persona || !voice) return Response.json({ error: "Unknown case or agent" }, { status: 404 });

  const said = (await loadTranscripts(sessionId))[agent].filter((t) => t.role === "actor");
  const text = said.at(-1)?.text ?? persona.openingLine;
  if (!text) return Response.json({ error: "Nothing to say yet" }, { status: 404 });

  const res = await speak(text, voice, req.signal);
  if (!res.ok || !res.body) {
    console.error("[voice] text-to-speech failed", res.status, (await res.text()).slice(0, 300));
    return Response.json({ error: "Couldn't play the voice" }, { status: 502 });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
