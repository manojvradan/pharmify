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
  /** Interviews per day for the last 7 days (Sydney time), oldest first; the last is today. */
  daily: { day: string; label: string; count: number }[];
  /** The last 10 results, oldest first. */
  recent: { pass: boolean; title: string }[];
  /** How each skill was marked across all graded interviews, in the report's order. */
  skills: { skill: string; yes: number; partly: number; no: number }[];
  /** Consecutive days (Sydney) with a finished interview, ending today or yesterday; `today` once today counts. */
  streak: { days: number; today: boolean };
};

/** Days are counted in Sydney time: candidates are in Australia, and the server runs in UTC. */
const TZ = "Australia/Sydney";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayName = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, weekday: "short" });

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

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return { day: dayKey.format(d), label: dayName.format(d), count: 0 };
  });
  const skillMarks = new Map<string, { yes: number; partly: number; no: number }>(
    SKILLS.map((sk) => [SKILL_LABEL[sk], { yes: 0, partly: 0, no: 0 }]),
  );
  const graded: { at: number; pass: boolean; title: string }[] = [];
  const playedDays = new Set<string>();

  for (const s of sessions) {
    if (!s.debrief) continue;
    const r = s.debrief.report;
    const pass = r.result === "pass";
    done++;
    if (s.startedAt.getTime() >= weekAgo) doneThisWeek++;
    const today = days.find((d) => d.day === dayKey.format(s.startedAt));
    if (today) today.count++;
    graded.push({ at: s.startedAt.getTime(), pass: r.result === "pass", title: s.debrief.caseTitle });
    playedDays.add(dayKey.format(s.startedAt));
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
      const marks = skillMarks.get(SKILL_LABEL[sk.skill]);
      if (marks && (sk.result === "yes" || sk.result === "partly" || sk.result === "no")) marks[sk.result]++;
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
    daily: days,
    recent: graded
      .sort((a, b) => a.at - b.at)
      .slice(-10)
      .map(({ pass, title }) => ({ pass, title })),
    skills: [...skillMarks.entries()].map(([skill, m]) => ({ skill, ...m })),
    streak: streakOf(playedDays, now),
  };
}

/**
 * The run of consecutive played days ending today, or ending yesterday if today hasn't been
 * played yet (the streak is still alive until the day is over).
 */
function streakOf(played: Set<string>, now: Date): { days: number; today: boolean } {
  const day = (offset: number) => dayKey.format(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000));
  const today = played.has(day(0));
  let days = 0;
  for (let i = today ? 0 : 1; played.has(day(i)); i++) days++;
  return { days, today };
}
