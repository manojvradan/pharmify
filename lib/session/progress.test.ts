import { describe, expect, it } from "vitest";
import { FAIL_CONDITIONS, SKILLS, type Debrief } from "./report";
import { computeProgress } from "./progress";

const now = new Date("2026-11-05T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

function debrief(pass: boolean, facts: [string, boolean][], gaps: (typeof SKILLS)[number][] = []): Debrief {
  return {
    caseTitle: "t",
    problemType: "p",
    draft: true,
    timeUsed: 600,
    facts: facts.map(([fact, found], i) => ({ id: String(i), fact, found, unlockHint: "" })),
    report: {
      result: pass ? "pass" : "not_yet",
      headline: "",
      summary: "",
      focus: { title: "", detail: "" },
      failConditions: FAIL_CONDITIONS.map((condition) => ({ condition, result: pass ? "pass" : "fail", evidence: "", moments: [] })),
      skills: SKILLS.map((skill) => ({ skill, result: gaps.includes(skill) ? "partly" : "yes" })),
      counselling: [],
      replays: [],
    },
  };
}

describe("computeProgress", () => {
  it("is empty with no graded sessions, and ignores unfinished ones", () => {
    const p = computeProgress([{ category: "clinical", startedAt: daysAgo(1), debrief: null }], now);
    expect(p).toMatchObject({ done: 0, passed: 0, factsTotal: 0, mostMissed: null, workOn: null });
    expect(p.byCategory.clinical).toEqual({ played: 0, passed: 0 });
  });

  it("counts results, this week, categories, facts and the commonest gaps", () => {
    const p = computeProgress(
      [
        { category: "clinical", startedAt: daysAgo(1), debrief: debrief(false, [["warfarin", false], ["generic", true]], ["Clear counselling"]) },
        { category: "clinical", startedAt: daysAgo(10), debrief: debrief(true, [["warfarin", false], ["generic", true]], ["Clear counselling", "History taking"]) },
        { category: "ethical", startedAt: daysAgo(2), debrief: debrief(true, []) },
        { category: undefined, startedAt: daysAgo(2), debrief: debrief(false, []) }, // case since removed from the bank
      ],
      now,
    );
    expect(p.done).toBe(4);
    expect(p.doneThisWeek).toBe(3);
    expect(p.passed).toBe(2);
    expect(p.byCategory).toEqual({
      clinical: { played: 2, passed: 1 },
      ethical: { played: 1, passed: 1 },
      legal: { played: 0, passed: 0 },
    });
    expect([p.factsFound, p.factsTotal]).toEqual([2, 4]);
    expect(p.mostMissed).toEqual({ fact: "warfarin", missed: 2 });
    expect(p.workOn).toEqual({ skill: "Counselling", sessions: 2 });
    // Last 7 days in Sydney time, oldest first, ending today (5 Nov in Sydney).
    expect(p.daily.map((d) => d.day)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]);
    expect(p.daily.map((d) => d.count)).toEqual([0, 0, 0, 0, 2, 1, 0]);
    expect(p.daily[6].label).toBe("Thu");
    // Oldest first: the 10-day-old pass, then the two from 2 days ago, then yesterday's.
    expect(p.recent.map((r) => r.pass)).toEqual([true, true, false, false]);
    const counselling = p.skills.find((s) => s.skill === "Counselling")!;
    expect(counselling).toEqual({ skill: "Counselling", yes: 2, partly: 2, no: 0 });
    expect(p.skills).toHaveLength(SKILLS.length);
  });

  it("counts a session late in the evening (Sydney) on that Sydney day, not the UTC one", () => {
    // 2026-11-05T13:30Z is 00:30 on 6 Nov in Sydney.
    const late = new Date("2026-11-05T13:30:00Z");
    const p = computeProgress([{ category: "clinical", startedAt: late, debrief: debrief(true, []) }], new Date("2026-11-05T14:00:00Z"));
    expect(p.daily[6]).toMatchObject({ day: "2026-11-06", count: 1 });
  });

  it("keeps only the last 10 results", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ category: "clinical" as const, startedAt: daysAgo(12 - i), debrief: debrief(i >= 10, []) }));
    const p = computeProgress(many, now);
    expect(p.recent).toHaveLength(10);
    expect(p.recent.slice(-2).every((r) => r.pass)).toBe(true);
  });
});
