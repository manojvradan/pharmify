import { z } from "zod";
import { anthropicErrorResponse } from "@/lib/anthropic";
import { getCase } from "@/lib/cases/bank";
import { Turn } from "@/lib/cases/schema";
import { gradeSession } from "@/lib/session/grader";

const Body = z.object({
  caseId: z.string(),
  transcripts: z.object({
    patient: z.array(Turn).max(200).default([]),
    prescriber: z.array(Turn).max(200).default([]),
  }),
  timeUsed: z.number().int().min(0).max(60 * 60),
});

// Grading reads the whole transcript with a careful model; allow it time.
export const maxDuration = 120;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const c = getCase(parsed.data.caseId);
  if (!c) return Response.json({ error: "Unknown case" }, { status: 404 });

  try {
    const debrief = await gradeSession(c, parsed.data.transcripts, parsed.data.timeUsed);
    return Response.json(debrief, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return anthropicErrorResponse(err, "grader");
  }
}
