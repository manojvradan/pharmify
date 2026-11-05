import type { CaseRecord } from "@/lib/cases/schema";
import type { Debrief } from "./report";
import { SKILLS } from "./report";

/** Plain-language names for the skills, as the home page shows them. */
const SKILL_LABEL: Record<(typeof SKILLS)[number], string> = {
  "History taking": "History taking",
  "Issue identified": "Spotting the issue",
  "Options considered": "Weighing options",
  "Prescriber contacted well": "Prescriber calls",
  "Clear counselling": "Counselling",
  "Prompt corrective action": "Acting promptly",
};

export type Category = CaseRecord["category"];

export type Progress = {
  /** Graded sessions only: an unfinished one has no result to count. */
  done: number;
  doneThisWeek: number;
  passed: number;
  factsFound: number;
  factsTotal: number;
  /** The hidden fact missed most often, if any were missed. */
  mostMissed: { fact: string; missed: number } | null;
  /** The skill most often marked "partly" or "no". */
  workOn: { skill: string; sessions: number } | null;
  byCategory: Record<Category, { played: number; passed: number }>;
};

export function computeProgress(
  sessions: { category: Category | undefined; startedAt: Date; debrief: Debrief | null }[],
  now: Date = new Date(),
): Progress {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const byCategory: Progress["byCategory"] = {
    ethical: { played: 0, passed: 0 },
    legal: { played: 0, passed: 0 },
    clinical: { played: 0, passed: 0 },
  };
  const missedCount = new Map<string, number>();
  const skillGaps = new Map<string, number>();
  let done = 0;
  let doneThisWeek = 0;
  let passed = 0;
  let factsFound = 0;
  let factsTotal = 0;

  for (const s of sessions) {
    if (!s.debrief) continue;
    const r = s.debrief.report;
    const pass = r.result === "pass";
    done++;
    if (s.startedAt.getTime() >= weekAgo) doneThisWeek++;
    if (pass) passed++;
    if (s.category) {
      byCategory[s.category].played++;
      if (pass) byCategory[s.category].passed++;
    }
    for (const f of s.debrief.facts) {
      factsTotal++;
      if (f.found) factsFound++;
      else missedCount.set(f.fact, (missedCount.get(f.fact) ?? 0) + 1);
    }
    for (const sk of r.skills) {
      if (sk.result === "partly" || sk.result === "no") {
        const label = SKILL_LABEL[sk.skill];
        skillGaps.set(label, (skillGaps.get(label) ?? 0) + 1);
      }
    }
  }

  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const missed = top(missedCount);
  const gap = top(skillGaps);

  return {
    done,
    doneThisWeek,
    passed,
    factsFound,
    factsTotal,
    mostMissed: missed ? { fact: missed[0], missed: missed[1] } : null,
    workOn: gap ? { skill: gap[0], sessions: gap[1] } : null,
    byCategory,
  };
}
