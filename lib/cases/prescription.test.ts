import { describe, expect, it } from "vitest";
import { prescriptionForm, scriptDate } from "./prescription";

const base = { item: "Atorvastatin 40 mg tablets", directions: "One tablet at night · Qty 30 · 5 repeats", footer: "Hospital · Mr R." };

describe("prescriptionForm", () => {
  it("reads quantity and repeats out of the directions", () => {
    const f = prescriptionForm(base);
    expect([f.instructions, f.quantity, f.repeats]).toEqual(["One tablet at night", "30", "5"]);
  });

  it("fills the patient from their bio, with the legal name only", () => {
    const f = prescriptionForm(base, { "Full name": "Ronald Ryan (goes by Ron)", "Date of birth": "14 May 1958", Age: "68", Address: "12 Banksia Street, Penrith NSW 2750" });
    expect([f.patientName, f.patientDob, f.patientAddress]).toEqual(["Ronald Ryan", "14/05/1958", "12 Banksia Street, Penrith NSW 2750"]);
  });

  it("prints a date of birth the way a script does, and leaves odd ones alone", () => {
    expect(["2 February 1986", "9 Sept 1955", "1986-02-02", "early 1950s"].map(scriptDate)).toEqual(["02/02/1986", "09/09/1955", "1986-02-02", "early 1950s"]);
  });

  it("prefers the case's own fields", () => {
    const f = prescriptionForm({ ...base, quantity: "60", patientName: "R. Ryan" }, { "Full name": "Ronald Ryan" });
    expect([f.quantity, f.patientName]).toEqual(["60", "R. Ryan"]);
  });

  it("takes the prescriber from the prescriber character when the case doesn't name one", () => {
    const f = prescriptionForm(base, {}, { "Full name": "Dr Andrew Burton", Role: "General practitioner", Workplace: "A local general practice" });
    expect([f.prescriber, f.prescriberDetail]).toEqual(["Dr Andrew Burton", "General practitioner · A local general practice"]);
    expect(prescriptionForm({ ...base, prescriber: "Dr A. Okafor" }, {}, { "Full name": "Dr X" }).prescriber).toBe("Dr A. Okafor");
  });

  it("keeps directions with no quantity as they are", () => {
    const f = prescriptionForm({ ...base, directions: "Take ONE tablet ONCE a day" });
    expect([f.instructions, f.quantity]).toEqual(["Take ONE tablet ONCE a day", undefined]);
  });
});
