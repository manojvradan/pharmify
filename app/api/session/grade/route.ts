import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { anthropicErrorResponse } from "@/lib/anthropic";
import { getCase } from "@/lib/cases/bank";
import { PART_SECONDS_BY_FORMAT, caseFormat } from "@/lib/cases/format";
import { elapsedSeconds, timeUsedAt } from "@/lib/session/clock";
import { gradeSession } from "@/lib/session/grader";
import { closeForGrading, getDebrief, getOwnedSession, loadTranscripts, recordUsage, saveDebrief } from "@/lib/session/store";
import { GRADER_MODEL } from "@/lib/anthropic";

const Body = z.object({ sessionId: z.uuid() });

// Grading reads the whole transcript with a careful model; allow it time.
export const maxDuration = 120;

/**
 * Ends the session and grades the saved transcript. Safe to call again: a graded
 * session returns its stored debrief, and the time used is fixed on the first call.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const session = await getOwnedSession(userId, parsed.data.sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  const headers = { "Cache-Control": "no-store" };

  const existing = await getDebrief(session.id);
  if (existing) return Response.json(existing, { headers });

  const c = getCase(session.caseId);
  if (!c) return Response.json({ error: "Unknown case" }, { status: 404 });

  const timeUsed = session.timeUsed ?? timeUsedAt(elapsedSeconds(session.startedAt), PART_SECONDS_BY_FORMAT[caseFormat(c.category)]);
  await closeForGrading(session.id, timeUsed);

  try {
    const { debrief, usage } = await gradeSession(c, await loadTranscripts(session.id), timeUsed);
    await saveDebrief(session.id, debrief, GRADER_MODEL);
    await recordUsage(userId, session.id, usage);
    return Response.json(debrief, { headers });
  } catch (err) {
    return anthropicErrorResponse(err, "grader");
  }
}
