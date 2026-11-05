import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import type { ProfileUpdate } from "@/lib/onboarding";

const { profiles } = schema;

export type Profile = typeof profiles.$inferSelect;

export async function getProfile(userId: string): Promise<Profile | undefined> {
  const [row] = await db().select().from(profiles).where(eq(profiles.userId, userId));
  return row;
}

/** Saves onboarding answers as they come in. Creates the row on first save. */
export async function saveProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
  const now = new Date();
  const values = {
    ...("examSitting" in update && { examSitting: update.examSitting }),
    ...(update.state && { state: update.state }),
    ...(update.internshipStage && { internshipStage: update.internshipStage }),
    ...(update.micChecked && { micCheckedAt: now }),
    ...(update.completed && { onboardedAt: now }),
  };
  const [row] = await db()
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: { ...values, updatedAt: now } })
    .returning();
  return row;
}

export async function deleteProfile(userId: string): Promise<void> {
  await db().delete(profiles).where(eq(profiles.userId, userId));
}

/** The signed-in user's profile, loaded once per request. Null when signed out. */
export const getViewerProfile = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return (await getProfile(userId)) ?? null;
});
