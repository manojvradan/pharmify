import { describe, expect, it } from "vitest";
import { GRACE_SECONDS, PART_SECONDS, canTakeTurn, elapsedSeconds, timeUsedAt } from "./clock";

describe("session clock", () => {
  const start = new Date("2026-11-05T10:00:00Z");
  const at = (s: number) => new Date(start.getTime() + s * 1000);

  it("counts whole seconds from the server start time, never negative", () => {
    expect(elapsedSeconds(start, at(90.9))).toBe(90);
    expect(elapsedSeconds(start, at(-5))).toBe(0);
  });

  it("allows turns until the part ends plus the grace period, then refuses", () => {
    expect(canTakeTurn(0)).toBe(true);
    expect(canTakeTurn(PART_SECONDS)).toBe(true);
    expect(canTakeTurn(PART_SECONDS + GRACE_SECONDS)).toBe(true);
    expect(canTakeTurn(PART_SECONDS + GRACE_SECONDS + 1)).toBe(false);
  });

  it("never reports more time used than the part allows", () => {
    expect(timeUsedAt(300)).toBe(300);
    expect(timeUsedAt(PART_SECONDS + 400)).toBe(PART_SECONDS);
  });
});
