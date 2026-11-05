import { describe, expect, it } from "vitest";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";
import { canTakeTurn, timeUsedAt } from "@/lib/session/clock";
import { timeCheck } from "@/components/SessionChrome";
import { PART_SECONDS_BY_FORMAT, caseFormat } from "./format";

describe("case format", () => {
  it("clinical cases are role plays; ethical and legal cases are spoken answers", () => {
    expect(caseFormat("clinical")).toBe("roleplay");
    expect(caseFormat("ethical")).toBe("explain");
    expect(caseFormat("legal")).toBe("explain");
  });

  it("explain cases are 5 minutes and role plays 20", () => {
    expect(PART_SECONDS_BY_FORMAT.explain).toBe(300);
    expect(PART_SECONDS_BY_FORMAT.roleplay).toBe(1200);
  });

  it.each(caseIds())("%s: public case carries its format, length, and characters only for role plays", (id) => {
    const c = getCase(id)!;
    const pub = toPublic(c);
    expect(pub.format).toBe(caseFormat(c.category));
    expect(pub.partSeconds).toBe(PART_SECONDS_BY_FORMAT[pub.format]);
    if (pub.format === "explain") expect(pub.agents).toEqual([]);
    else expect(pub.agents.length).toBeGreaterThan(0);
  });
});

describe("clock limits per format", () => {
  it("a 5-minute answer closes after its limit plus grace", () => {
    expect(canTakeTurn(300, 300)).toBe(true);
    expect(canTakeTurn(311, 300)).toBe(false);
    expect(canTakeTurn(350, 300, 60)).toBe(true);
    expect(timeUsedAt(400, 300)).toBe(300);
  });

  it("role plays keep the 20-minute default", () => {
    expect(canTakeTurn(1200)).toBe(true);
    expect(timeUsedAt(1500)).toBe(1200);
  });
});

describe("examiner time checks", () => {
  it("a 5-minute answer gets only the one-minute warning", () => {
    expect(timeCheck(299, 300)).toBeNull();
    expect(timeCheck(60, 300)).toBe("One minute remaining.");
  });

  it("a 20-minute role play gets the five- and one-minute warnings", () => {
    expect(timeCheck(301, 1200)).toBeNull();
    expect(timeCheck(300, 1200)).toBe("Five minutes remaining.");
    expect(timeCheck(60, 1200)).toBe("One minute remaining.");
  });
});
