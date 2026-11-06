import { auth } from "@clerk/nextjs/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { z } from "zod";
import { getCase, toPublic } from "@/lib/cases/bank";
import { caseFormat } from "@/lib/cases/format";
import { getOwnedSession } from "@/lib/session/store";
import { issueAgentTicket } from "@/lib/voice/agentTicket";
import { type AgentJobMetadata, VOICE_AGENT_NAME } from "@/lib/voice/agentTicket.shared";
import { VOICES } from "@/lib/voice/elevenlabs";
import { liveKitEnabled } from "@/lib/voice/livekit";

const Body = z.object({ sessionId: z.uuid() });

/**
 * Joins a hands-free voice room for one live role-play session. The room is created on
 * first join and LiveKit dispatches the Pharmify agent into it with the job metadata
 * below; the agent then talks through /api/session/turn with the signed ticket, so the
 * fact gate, clock and saved transcript are exactly as in a typed session.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  if (!liveKitEnabled()) return Response.json({ error: "Hands-free voice is off" }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { sessionId } = parsed.data;
  const session = await getOwnedSession(userId, sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "live") return Response.json({ error: "This session has ended", ended: true }, { status: 409 });
  const c = getCase(session.caseId);
  if (!c || caseFormat(c.category) !== "roleplay") return Response.json({ error: "This case has no role play" }, { status: 400 });

  const metadata: AgentJobMetadata = {
    sessionId,
    ticket: issueAgentTicket(sessionId, userId),
    apiBase: process.env.AGENT_API_BASE ?? new URL(req.url).origin,
    characters: toPublic(c).agents.map((a) => ({
      id: a.id,
      name: a.name,
      openingLine: a.openingLine,
      voiceId: VOICES[a.avatar],
    })),
  };

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: "candidate",
    ttl: "30m",
  });
  const room = `session-${sessionId}`;
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
  // Dispatch happens when the room is first created, i.e. on the first join.
  at.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: VOICE_AGENT_NAME, metadata: JSON.stringify(metadata) })],
  });

  return Response.json({ url: process.env.LIVEKIT_URL, token: await at.toJwt() }, { headers: { "Cache-Control": "no-store" } });
}
