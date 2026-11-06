import type { CaseRecord } from "./schema";

/**
 * How a case is sat.
 * - "roleplay" (complex clinical): a 20-minute conversation with the patient and prescriber.
 * - "explain" (ethical and legal): the candidate reads the case, then talks for 5 minutes,
 *   uninterrupted, about what they would do and why. No one replies.
 */
export type CaseFormat = "roleplay" | "explain";

export function caseFormat(category: CaseRecord["category"]): CaseFormat {
  return category === "clinical" ? "roleplay" : "explain";
}

/** Length of the answer part, in seconds. */
export const PART_SECONDS_BY_FORMAT: Record<CaseFormat, number> = {
  roleplay: 20 * 60,
  explain: 5 * 60,
};
