import { describe, expect, it } from "vitest";
import { prescriptionForm } from "./prescription";

const base = { item: "Atorvastatin 40 mg tablets", directions: "One tablet at night · Qty 30 · 5 repeats", footer: "Hospital · Mr R." };

describe("prescriptionForm", () => {
  it("reads quantity and repeats out of the directions", () => {
    const f = prescriptionForm(base);
    expect([f.instructions, f.quantity, f.repeats]).toEqual(["One tablet at night", "30", "5"]);
  });

  it("fills the patient from their bio, with the legal name only", () => {
    const f = prescriptionForm(base, { "Full name": "Ronald Ryan (goes by Ron)", Age: "68", Address: "12 Banksia Street, Penrith NSW 2750" });
    expect([f.patientName, f.patientAge, f.patientAddress]).toEqual(["Ronald Ryan", "68 years", "12 Banksia Street, Penrith NSW 2750"]);
  });

  it("prefers the case's own fields", () => {
    const f = prescriptionForm({ ...base, quantity: "60", patientName: "R. Ryan" }, { "Full name": "Ronald Ryan" });
    expect([f.quantity, f.patientName]).toEqual(["60", "R. Ryan"]);
  });

  it("keeps directions with no quantity as they are", () => {
    const f = prescriptionForm({ ...base, directions: "Take ONE tablet ONCE a day" });
    expect([f.instructions, f.quantity]).toEqual(["Take ONE tablet ONCE a day", undefined]);
  });
});
