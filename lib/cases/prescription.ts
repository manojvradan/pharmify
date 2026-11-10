import type { CaseRecord } from "./schema";

type Prescription = NonNullable<CaseRecord["documents"]["prescription"]>;

/** The prescription as the session's script form shows it: every field it has a value for, from wherever it comes. */
export type PrescriptionForm = Prescription & {
  /** `directions` without the quantity and repeats, which have their own boxes. */
  instructions: string;
};

const QTY = /\bqty\.?\s*(\d+)\b/i;
const REPEATS = /\b(\d+)\s*repeats?\b/i;

/**
 * Fills the script form: structured fields win, then the patient's bio (name, age, address),
 * then quantity and repeats read out of `directions` ("One tablet at night · Qty 30 · 5 repeats").
 */
export function prescriptionForm(p: Prescription, patientBio: Record<string, string> = {}): PrescriptionForm {
  const parts = p.directions.split(/\s*·\s*/);
  const qty = p.directions.match(QTY)?.[1];
  const repeats = p.directions.match(REPEATS)?.[1];
  const instructions = parts.filter((x) => !QTY.test(x) && !REPEATS.test(x)).join(" · ") || p.directions;
  const age = p.patientAge ?? (patientBio.Age ? `${patientBio.Age} years` : undefined);
  return {
    ...p,
    instructions,
    // "Ronald Ryan (goes by Ron)" is how the actor knows them; a script has the legal name.
    patientName: p.patientName ?? patientBio["Full name"]?.replace(/\s*\(.*\)\s*$/, ""),
    patientAge: age,
    patientAddress: p.patientAddress ?? patientBio.Address,
    quantity: p.quantity ?? qty,
    repeats: p.repeats ?? repeats,
  };
}
