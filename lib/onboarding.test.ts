import { describe, expect, it } from "vitest";
import { ProfileUpdate, sittingLabel, upcomingSittings } from "./onboarding";

describe("upcomingSittings", () => {
  it("lists the next three sittings, counting the current month", () => {
    expect(upcomingSittings(new Date(2026, 1, 20))).toEqual(["2026-02", "2026-06", "2026-10"]);
    expect(upcomingSittings(new Date(2026, 2, 1))).toEqual(["2026-06", "2026-10", "2027-02"]);
  });

  it("rolls into next year after the last sitting", () => {
    expect(upcomingSittings(new Date(2026, 10, 5))).toEqual(["2027-02", "2027-06", "2027-10"]);
  });
});

describe("sittingLabel", () => {
  it("names the month and year", () => {
    expect(sittingLabel("2027-02")).toBe("February 2027");
    expect(sittingLabel("2026-10")).toBe("October 2026");
  });
});

describe("ProfileUpdate", () => {
  it("accepts partial answers, including 'not booked yet'", () => {
    expect(ProfileUpdate.parse({ examSitting: null })).toEqual({ examSitting: null });
    expect(ProfileUpdate.parse({ state: "NSW", internshipStage: "halfway" })).toEqual({ state: "NSW", internshipStage: "halfway" });
    expect(ProfileUpdate.parse({ completed: true })).toEqual({ completed: true });
  });

  it("rejects unknown values and extra fields", () => {
    for (const bad of [
      { state: "NZ" },
      { internshipStage: "done" },
      { examSitting: "Feb 2027" },
      { examSitting: "2027-13" },
      { completed: false },
      { onboardedAt: "2026-01-01" },
      null,
    ]) {
      expect(ProfileUpdate.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});
