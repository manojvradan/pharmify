import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A short-lived, signed pass that lets the hands-free voice agent (agent/, on LiveKit
 * Cloud) take turns in one session on the candidate's behalf. The agent has no Clerk
 * cookie, so /api/session/turn accepts this instead: it names one session and one user,
 * and expires with the room. Signed with AGENT_TICKET_SECRET, shared with nobody else.
 */

type Ticket = { sid: string; uid: string; exp: number };

const TTL_SECONDS = 40 * 60; // a 20-minute part plus slack

function secret(): string {
  const s = process.env.AGENT_TICKET_SECRET;
  if (!s || s.length < 32) throw new Error("AGENT_TICKET_SECRET is not set (32+ characters)");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function agentTicketsEnabled(): boolean {
  return (process.env.AGENT_TICKET_SECRET?.length ?? 0) >= 32;
}

export function issueAgentTicket(sessionId: string, userId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ sid: sessionId, uid: userId, exp: Math.floor(now / 1000) + TTL_SECONDS } satisfies Ticket)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** The user the ticket acts for, if it is valid, unexpired and for this session. */
export function verifyAgentTicket(ticket: string, sessionId: string, now = Date.now()): string | null {
  if (!agentTicketsEnabled()) return null;
  const [payload, mac] = ticket.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const t = JSON.parse(Buffer.from(payload, "base64url").toString()) as Ticket;
    if (t.sid !== sessionId || typeof t.uid !== "string" || t.exp * 1000 < now) return null;
    return t.uid;
  } catch {
    return null;
  }
}
