import { z } from "zod";

/**
 * Onboarding answers: shared by the onboarding page, the profile API and the schema.
 * Source: the "Onboarding" board of the Pharmify design.
 */

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;
export type AuState = (typeof AU_STATES)[number];

export const INTERNSHIP_STAGES = {
  started: "Just started",
  halfway: "About halfway",
  "nearly-done": "Nearly done",
} as const;
export type InternshipStage = keyof typeof INTERNSHIP_STAGES;
export const INTERNSHIP_STAGE_IDS = Object.keys(INTERNSHIP_STAGES) as [InternshipStage, ...InternshipStage[]];

/**
 * Months the oral exam is assumed to run, from the design. Placeholder: check the
 * Pharmacy Board's published sitting dates and update this list.
 */
export const SITTING_MONTHS = [2, 6, 10] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** A sitting is stored as "YYYY-MM". */
export const Sitting = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export function sittingLabel(sitting: string): string {
  const [y, m] = sitting.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/** The next `count` sittings after `now`: a sitting in the current month still counts. */
export function upcomingSittings(now: Date, count = 3): string[] {
  const out: string[] = [];
  let year = now.getFullYear();
  const month = now.getMonth() + 1;
  let i = SITTING_MONTHS.findIndex((m) => m >= month);
  if (i === -1) {
    i = 0;
    year += 1;
  }
  while (out.length < count) {
    out.push(`${year}-${String(SITTING_MONTHS[i]).padStart(2, "0")}`);
    i += 1;
    if (i === SITTING_MONTHS.length) {
      i = 0;
      year += 1;
    }
  }
  return out;
}

/**
 * What the onboarding page sends. Every field is optional so answers can be saved as
 * the candidate goes; `examSitting: null` means "not booked yet".
 */
export const ProfileUpdate = z
  .object({
    examSitting: Sitting.nullable(),
    state: z.enum(AU_STATES),
    internshipStage: z.enum(INTERNSHIP_STAGE_IDS),
    micChecked: z.literal(true),
    completed: z.literal(true),
  })
  .partial()
  .strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;
