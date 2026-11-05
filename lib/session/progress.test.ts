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
  });
});
