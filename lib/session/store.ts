import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import type { Debrief } from "./report";

const { sessions, turns, debriefs, usageEvents, profiles } = schema;

export type SessionRow = typeof sessions.$inferSelect;
export type Transcripts = Record<AgentId, Turn[]>;

export async function createSession(userId: string, c: CaseRecord): Promise<SessionRow> {
  const [row] = await db()
    .insert(sessions)
    .values({ userId, caseId: c.id, caseVersion: c.review.version })
    .returning();
  return row;
}

/** The session, only if it belongs to this user. Every route goes through this. */
export async function getOwnedSession(userId: string, sessionId: string): Promise<SessionRow | undefined> {
  const [row] = await db()
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  return row;
}

export async function loadTranscripts(sessionId: string): Promise<Transcripts> {
  const rows = await db()
    .select({ agent: turns.agent, role: turns.role, text: turns.text, t: turns.t })
    .from(turns)
    .where(eq(turns.sessionId, sessionId))
    .orderBy(asc(turns.id));
  const out: Transcripts = { patient: [], prescriber: [] };
  for (const r of rows) out[r.agent].push({ role: r.role, text: r.text, t: r.t });
  return out;
}

export async function appendTurns(
  sessionId: string,
  agent: AgentId,
  rows: (Turn & { unlockedFactIds?: string[] })[],
): Promise<void> {
  if (rows.length === 0) return;
  await db()
    .insert(turns)
    .values(rows.map((r) => ({ sessionId, agent, role: r.role, text: r.text, t: r.t, unlockedFactIds: r.unlockedFactIds ?? [] })));
}

/**
 * Closes a live session for grading and fixes its time used. Only the first call
 * sets the time, so a retried grade can't stretch the clock.
 */
export async function closeForGrading(sessionId: string, timeUsed: number): Promise<void> {
  await db()
    .update(sessions)
    .set({ status: "grading", endedAt: new Date(), timeUsed })
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, "live")));
}

export async function getDebrief(sessionId: string): Promise<Debrief | undefined> {
  const [row] = await db().select({ debrief: debriefs.debrief }).from(debriefs).where(eq(debriefs.sessionId, sessionId));
  return row?.debrief;
}

export async function saveDebrief(sessionId: string, debrief: Debrief, graderModel: string): Promise<void> {
  await db().insert(debriefs).values({ sessionId, debrief, graderModel }).onConflictDoNothing();
  await db().update(sessions).set({ status: "graded" }).where(eq(sessions.id, sessionId));
}

export type UsageRecord = {
  kind: "actor" | "grader";
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  };
  ttftMs?: number | null;
  durationMs: number;
};

/** Best effort: a failed usage write is logged, never surfaced to the candidate. */
export async function recordUsage(userId: string, sessionId: string | null, records: UsageRecord[]): Promise<void> {
  if (records.length === 0) return;
  try {
    await db()
      .insert(usageEvents)
      .values(
        records.map((r) => ({
          userId,
          sessionId,
          kind: r.kind,
          model: r.model,
          inputTokens: r.usage.input_tokens,
          outputTokens: r.usage.output_tokens,
          cacheReadTokens: r.usage.cache_read_input_tokens ?? 0,
          cacheWriteTokens: r.usage.cache_creation_input_tokens ?? 0,
          ttftMs: r.ttftMs == null ? null : Math.round(r.ttftMs),
          durationMs: Math.round(r.durationMs),
        })),
      );
  } catch (err) {
    console.error("[usage] failed to record", err);
  }
}

export type SessionSummary = {
  id: string;
  caseId: string;
  status: SessionRow["status"];
  startedAt: Date;
  timeUsed: number | null;
  debrief: Debrief | null;
};

/** The user's sessions, newest first, with their debriefs where graded. */
export async function listSessions(userId: string, limit = 50): Promise<SessionSummary[]> {
  const rows = await db()
    .select({
      id: sessions.id,
      caseId: sessions.caseId,
      status: sessions.status,
      startedAt: sessions.startedAt,
      timeUsed: sessions.timeUsed,
      debrief: debriefs.debrief,
    })
    .from(sessions)
    .leftJoin(debriefs, eq(debriefs.sessionId, sessions.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
  return rows;
}

/** Deletes everything stored for a user. Turns, debriefs and usage cascade from sessions. */
export async function deleteUserData(userId: string): Promise<number> {
  const mine = await db().select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  if (mine.length > 0) {
    await db()
      .delete(sessions)
      .where(inArray(sessions.id, mine.map((s) => s.id)));
  }
  await db().delete(usageEvents).where(eq(usageEvents.userId, userId));
  await db().delete(profiles).where(eq(profiles.userId, userId));
  return mine.length;
}
