import type { CaseRecord } from "./schema";

type Prescription = NonNullable<CaseRecord["documents"]["prescription"]>;

/** The prescription as the session's script form shows it: every field it has a value for, from wherever it comes. */
export type PrescriptionForm = Prescription & {
  /** `directions` without the quantity and repeats, which have their own boxes. */
  instructions: string;
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "14 May 1958" → "14/05/1958", the way a script prints it. Anything else is kept as written. */
export function scriptDate(date: string): string {
  const m = date.trim().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  const month = m && MONTHS.findIndex((x) => x.startsWith(m[2].toLowerCase()) && m[2].length >= 3);
  if (!m || month == null || month < 0) return date;
  return `${m[1].padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${m[3]}`;
}

const QTY = /\bqty\.?\s*(\d+)\b/i;
const REPEATS = /\b(\d+)\s*repeats?\b/i;

/**
 * Fills the script form: structured fields win, then the patient's bio (name, date of birth, address),
 * then quantity and repeats read out of `directions` ("One tablet at night · Qty 30 · 5 repeats").
 */
export function prescriptionForm(
  p: Prescription,
  patientBio: Record<string, string> = {},
  /** The prescriber character's bio: who signed the script when the case doesn't say. */
  prescriberBio: Record<string, string> = {},
): PrescriptionForm {
  const parts = p.directions.split(/\s*·\s*/);
  const qty = p.directions.match(QTY)?.[1];
  const repeats = p.directions.match(REPEATS)?.[1];
  const instructions = parts.filter((x) => !QTY.test(x) && !REPEATS.test(x)).join(" · ") || p.directions;
  const dob = patientBio["Date of birth"];
  return {
    ...p,
    prescriber: p.prescriber ?? prescriberBio["Full name"],
    prescriberDetail: p.prescriberDetail ?? ([prescriberBio.Role, prescriberBio.Workplace].filter(Boolean).join(" · ") || undefined),
    instructions,
    // "Ronald Ryan (goes by Ron)" is how the actor knows them; a script has the legal name.
    patientName: p.patientName ?? patientBio["Full name"]?.replace(/\s*\(.*\)\s*$/, ""),
    patientDob: p.patientDob ?? (dob ? scriptDate(dob) : undefined),
    patientAddress: p.patientAddress ?? patientBio.Address,
    quantity: p.quantity ?? qty,
    repeats: p.repeats ?? repeats,
  };
}
