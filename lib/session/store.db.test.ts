import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import raw from "@/data/cases/atorvastatin-doubling-up.json";
import { CaseRecord } from "@/lib/cases/schema";
import { FAIL_CONDITIONS, SKILLS, type Debrief } from "./report";
import {
  appendTurns,
  closeForGrading,
  createSession,
  deleteUserData,
  getDebrief,
  getOwnedSession,
  listSessions,
  loadTranscripts,
  recordUsage,
  saveDebrief,
} from "./store";

/** Runs against the real database. Uses a throwaway user id and deletes everything it made. */
const c = CaseRecord.parse(raw);
const userId = `test_${randomUUID()}`;
const otherUser = `test_${randomUUID()}`;

const debrief: Debrief = {
  caseTitle: c.title,
  problemType: c.problemType,
  draft: true,
  timeUsed: 120,
  facts: [],
  report: {
    result: "not_yet",
    headline: "h",
    summary: "s",
    focus: { title: "t", detail: "d" },
    failConditions: FAIL_CONDITIONS.map((condition) => ({ condition, result: "pass", evidence: "e", moments: [] })),
    skills: SKILLS.map((skill) => ({ skill, result: "yes" })),
    counselling: [],
    replays: [],
  },
};

afterAll(async () => {
  await deleteUserData(userId);
  await deleteUserData(otherUser);
});

describe("session store (live database)", () => {
  it("runs a session from start to saved debrief, and deletes it on request", async () => {
    const s = await createSession(userId, c);
    expect(s).toMatchObject({ userId, caseId: c.id, caseVersion: c.review.version, status: "live", timeUsed: null });

    // Only the owner can load it.
    expect(await getOwnedSession(userId, s.id)).toMatchObject({ id: s.id });
    expect(await getOwnedSession(otherUser, s.id)).toBeUndefined();

    await appendTurns(s.id, "patient", [
      { role: "actor", text: "G'day.", t: 3 },
      { role: "candidate", text: "Any other medicines?", t: 10, unlockedFactIds: ["takes-warfarin"] },
    ]);
    await appendTurns(s.id, "prescriber", [{ role: "candidate", text: "Hi doctor.", t: 60 }]);
    await appendTurns(s.id, "patient", [{ role: "actor", text: "Just the warfarin.", t: 10 }]);
    expect(await loadTranscripts(s.id)).toEqual({
      patient: [
        { role: "actor", text: "G'day.", t: 3 },
        { role: "candidate", text: "Any other medicines?", t: 10 },
        { role: "actor", text: "Just the warfarin.", t: 10 },
      ],
      prescriber: [{ role: "candidate", text: "Hi doctor.", t: 60 }],
    });

    // The first close fixes the time used; a second close can't change it.
    await closeForGrading(s.id, 120);
    await closeForGrading(s.id, 900);
    expect(await getOwnedSession(userId, s.id)).toMatchObject({ status: "grading", timeUsed: 120 });

    await saveDebrief(s.id, debrief, "test-model");
    await saveDebrief(s.id, { ...debrief, timeUsed: 999 }, "test-model"); // a second save keeps the first
    expect((await getDebrief(s.id))?.timeUsed).toBe(120);
    expect(await getOwnedSession(userId, s.id)).toMatchObject({ status: "graded" });

    await recordUsage(userId, s.id, [
      { kind: "actor", model: "m", usage: { input_tokens: 10, output_tokens: 5 }, ttftMs: 812.4, durationMs: 1200.6 },
    ]);

    const list = await listSessions(userId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: s.id, status: "graded", timeUsed: 120 });
    expect(list[0].debrief?.report.headline).toBe("h");
    expect(await listSessions(otherUser)).toEqual([]);

    expect(await deleteUserData(userId)).toBe(1);
    expect(await getOwnedSession(userId, s.id)).toBeUndefined();
    expect(await loadTranscripts(s.id)).toEqual({ patient: [], prescriber: [] });
    expect(await getDebrief(s.id)).toBeUndefined();
  });
});
