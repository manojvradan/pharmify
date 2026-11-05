import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { getCase } from "@/lib/cases/bank";
import { computeProgress } from "./progress";
import { listSessions } from "./store";

/** The signed-in user's sessions, loaded once per request however many components ask. */
export const getViewerSessions = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return listSessions(userId);
});

export const getViewerProgress = cache(async () => {
  const sessions = await getViewerSessions();
  if (!sessions) return null;
  return computeProgress(
    sessions.map((s) => ({ category: getCase(s.caseId)?.category, startedAt: s.startedAt, debrief: s.debrief })),
  );
});
