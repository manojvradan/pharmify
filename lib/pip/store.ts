import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getCase } from "@/lib/cases/bank";
import { db, schema } from "@/lib/db";
import type { ItemId, Outfit } from "./items";
import { computeUnlocks, ownedOnly, wear, type Unlocks } from "./rewards";

const { sessions, debriefs, profiles } = schema;

/** The user's passed sessions with their case's category, and what those passes won. */
export async function getUnlocks(userId: string): Promise<Unlocks> {
  const rows = await db()
    .select({ sessionId: sessions.id, caseId: sessions.caseId, at: sessions.startedAt })
    .from(sessions)
    .innerJoin(debriefs, eq(debriefs.sessionId, sessions.id))
    .where(and(eq(sessions.userId, userId), sql`${debriefs.debrief}->'report'->>'result' = 'pass'`));
  return computeUnlocks(rows.map((r) => ({ sessionId: r.sessionId, category: getCase(r.caseId)?.category, at: r.at })));
}

export type Wardrobe = { owned: ItemId[]; outfit: Outfit };

export async function getWardrobe(userId: string): Promise<Wardrobe> {
  const [unlocks, [profile]] = await Promise.all([
    getUnlocks(userId),
    db().select({ outfit: profiles.pipOutfit }).from(profiles).where(eq(profiles.userId, userId)),
  ]);
  return { owned: unlocks.owned, outfit: ownedOnly(profile?.outfit ?? {}, unlocks.owned) };
}

/** Saves what Pip wears. The caller has checked every item is owned. Creates the profile row if needed. */
export async function saveOutfit(userId: string, outfit: Outfit): Promise<void> {
  await db()
    .insert(profiles)
    .values({ userId, pipOutfit: outfit })
    .onConflictDoUpdate({ target: profiles.userId, set: { pipOutfit: outfit, updatedAt: new Date() } });
}

/**
 * Called once, right after a session is graded: what the pass won, already put on Pip
 * so the reward shows everywhere at once. Best effort: a failure here never fails grading.
 */
export async function claimReward(userId: string, sessionId: string): Promise<ItemId[]> {
  try {
    const won = await rewardFor(userId, sessionId);
    if (won.length > 0) {
      const { outfit } = await getWardrobe(userId);
      await saveOutfit(userId, wear(outfit, won));
    }
    return won;
  } catch (err) {
    console.error("[pip] failed to claim reward", err);
    return [];
  }
}

/** What this session won, if anything. */
export async function rewardFor(userId: string, sessionId: string): Promise<ItemId[]> {
  return (await getUnlocks(userId)).bySession.get(sessionId) ?? [];
}
