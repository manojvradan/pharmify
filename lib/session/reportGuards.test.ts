import { describe, expect, it } from "vitest";
import raw from "@/data/cases/atorvastatin-doubling-up.json";
import { CaseRecord, type Turn } from "@/lib/cases/schema";
import { FAIL_CONDITIONS, SKILLS, type GraderReport } from "./report";
import { ReportShapeError, anchorMoments, finaliseReport } from "./reportGuards";
import { stripSpeakerLabel } from "./speech";

const atorva = CaseRecord.parse(raw);

const transcripts: { patient: Turn[]; prescriber: Turn[] } = {
  patient: [
    { role: "actor", text: "G'day. The hospital gave me this one for my cholesterol.", t: 0 },
    { role: "candidate", text: "Okay, so just the one tablet then. I’ll give your GP a call.", t: 130 },
    { role: "actor", text: "Righto, I'll wait here.", t: 135 },
  ],
  prescriber: [{ role: "candidate", text: "I think he might be on two statins, so maybe he should stop one?", t: 250 }],
};

function report(overrides: Partial<GraderReport> = {}): GraderReport {
  return {
    result: "pass",
    headline: "h",
    summary: "s",
    focus: { title: "t", detail: "d" },
    failConditions: FAIL_CONDITIONS.map((condition) => ({ condition, result: "pass", evidence: "e", moments: [] })),
    skills: SKILLS.map((skill) => ({ skill, result: "yes" })),
    counselling: [],
    replays: [],
    ...overrides,
  };
}

describe("anchorMoments", () => {
  it("keeps a quote found in that speaker's turn and takes the time from the transcript", () => {
    const out = anchorMoments(
      [{ time: "99:99", agent: "patient", speaker: "candidate", quote: "just the one tablet then", note: "n" }],
      transcripts,
    );
    expect(out).toEqual([expect.objectContaining({ time: "02:10", quote: "just the one tablet then" })]);
  });

  it("matches despite curly quotes, case, surrounding quote marks and an ellipsis", () => {
    const out = anchorMoments(
      [{ time: "", agent: "patient", speaker: "candidate", quote: "“I'll give your GP a call…”", note: "n" }],
      transcripts,
    );
    expect(out).toHaveLength(1);
  });

  it("drops quotes that aren't in the transcript, or are in the wrong conversation or speaker", () => {
    const out = anchorMoments(
      [
        { time: "", agent: "patient", speaker: "candidate", quote: "Are you taking any other medicines?", note: "invented" },
        { time: "", agent: "prescriber", speaker: "candidate", quote: "just the one tablet then", note: "wrong agent" },
        { time: "", agent: "patient", speaker: "actor", quote: "just the one tablet then", note: "wrong speaker" },
        { time: "", agent: "patient", speaker: "candidate", quote: "  ", note: "empty" },
      ],
      transcripts,
    );
    expect(out).toEqual([]);
  });

  it("sorts moments by time", () => {
    const out = anchorMoments(
      [
        { time: "", agent: "prescriber", speaker: "candidate", quote: "two statins", note: "later" },
        { time: "", agent: "patient", speaker: "actor", quote: "this one for my cholesterol", note: "earlier" },
      ],
      transcripts,
    );
    expect(out.map((m) => m.time)).toEqual(["00:00", "04:10"]);
  });
});

describe("finaliseReport", () => {
  it("derives the overall result from the fail conditions, whatever the model said", () => {
    const failing = report({
      result: "pass",
      failConditions: FAIL_CONDITIONS.map((condition, i) => ({
        condition,
        result: i === 1 ? "fail" : "pass",
        evidence: "e",
        moments: [],
      })),
    });
    expect(finaliseReport(failing, atorva, transcripts).result).toBe("not_yet");
    expect(finaliseReport(report({ result: "not_yet" }), atorva, transcripts).result).toBe("pass");
  });

  it("returns fail conditions and skills once each, in canonical order", () => {
    const shuffled = report();
    shuffled.failConditions = [...shuffled.failConditions].reverse();
    shuffled.failConditions.push({ ...shuffled.failConditions[0], result: "fail" }); // duplicate: first one wins
    const out = finaliseReport(shuffled, atorva, transcripts);
    expect(out.failConditions.map((f) => f.condition)).toEqual([...FAIL_CONDITIONS]);
    expect(out.result).toBe("pass");
    expect(out.skills.map((s) => s.skill)).toEqual([...SKILLS]);
  });

  it("throws a ReportShapeError when a fail condition or skill is missing", () => {
    const missing = report();
    missing.failConditions = missing.failConditions.slice(1);
    expect(() => finaliseReport(missing, atorva, transcripts)).toThrow(ReportShapeError);
    const noSkill = report();
    noSkill.skills = noSkill.skills.slice(0, 2);
    expect(() => finaliseReport(noSkill, atorva, transcripts)).toThrow(/skills/);
  });

  it("lines counselling up with the answer key: its points, its order, missing points not covered, extras dropped", () => {
    const out = finaliseReport(
      report({
        counselling: [
          { point: "timing", covered: true },
          { point: "Dose", covered: true },
          { point: "Drink plenty of water", covered: true },
        ],
      }),
      atorva,
      transcripts,
    );
    expect(out.counselling).toEqual([
      { point: "Dose", covered: true },
      { point: "Timing", covered: true },
      { point: "Side effects", covered: false },
      { point: "What to watch for", covered: false },
      { point: "When to return", covered: false },
    ]);
  });

  it("keeps only replays that quote the candidate exactly, with times from the transcript", () => {
    const out = finaliseReport(
      report({
        replays: [
          { time: "11:05", agent: "patient", youSaid: "Okay, so just the one tablet then.", tryInstead: "x" },
          { time: "12:00", agent: "patient", youSaid: "Righto, I'll wait here.", tryInstead: "actor line, not candidate" },
          { time: "13:00", agent: "patient", youSaid: "Something never said", tryInstead: "x" },
        ],
      }),
      atorva,
      transcripts,
    );
    expect(out.replays).toEqual([expect.objectContaining({ time: "02:10", youSaid: "Okay, so just the one tablet then." })]);
  });
});

describe("stripSpeakerLabel", () => {
  it.each([
    ["Mr R.: Oh, yes, the warfarin.", "Oh, yes, the warfarin."],
    ["  mr r. :  Oh, yes.", "Oh, yes."],
    ["Patient: Not sure, love.", "Not sure, love."],
  ])("strips %j", (input, expected) => {
    expect(stripSpeakerLabel(input, "Mr R.", true)).toBe(expected);
  });

  it("leaves ordinary replies alone, including ones that mention the name", () => {
    expect(stripSpeakerLabel("Oh, yes, the warfarin.", "Mr R.", true)).toBe("Oh, yes, the warfarin.");
    expect(stripSpeakerLabel("Mr R. is my name, love.", "Mr R.", true)).toBe("Mr R. is my name, love.");
  });

  it("waits while a streamed prefix could still become a label, then decides", () => {
    expect(stripSpeakerLabel("Mr R", "Mr R.")).toBeUndefined();
    expect(stripSpeakerLabel("Mr R.", "Mr R.")).toBeUndefined();
    expect(stripSpeakerLabel("Mr R.: Oh", "Mr R.")).toBe("Oh");
    expect(stripSpeakerLabel("Oh, yes, I take the warfarin as well.", "Mr R.")).toBe(
      "Oh, yes, I take the warfarin as well.",
    );
  });

  it("works for names with regex characters", () => {
    expect(stripSpeakerLabel("Dr [GP]: Go on.", "Dr [GP]", true)).toBe("Go on.");
  });
});
