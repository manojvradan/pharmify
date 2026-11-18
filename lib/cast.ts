/**
 * The cast: the characters who play patients and prescribers. Drawings are in
 * components/CastAvatar.tsx; this file holds only ids and descriptions, so case data
 * and the case schema can refer to a character without importing any React.
 * Source: the "Meet the cast" design sheet. `about` starts with what the drawing shows
 * (so the bot can match a persona's age and gender to a character); `tests` (patients only)
 * is the skill each one puts under pressure. A persona keeps its own name and age: the
 * character is only who draws it.
 */

export const CAST = {
  "bertie-walsh": { name: "Bertie Walsh", kind: "patient", about: "Older man, 68, glasses, grey hair · Retired postie. Warm and chatty; forgets which tablets he's already taking.", tests: "Medication histories, doubling up" },
  "kiki-nguyen": { name: "Kiki Nguyen", kind: "patient", about: "Young woman, 20, dark hair in a bun, hoodie · Uni student. Sleepy, vague answers; needs things explained simply.", tests: "Clear counselling, checking understanding" },
  "wally-morris": { name: "Wally Morris", kind: "patient", about: "Man, 45, brown beard, hi-vis shirt · Tradie. Gruff and in a hurry; wants to be in and out.", tests: "Staying calm, getting key facts fast" },
  "rosie-costa": { name: "Rosie Costa", kind: "patient", about: "Older woman, 68, curly grey hair, pearls · Grandmother. Loves a chat; takes a lot of medicines from different doctors.", tests: "Interactions, multiple prescribers" },
  "penny-okafor": { name: "Penny Okafor", kind: "patient", about: "Woman, 31, dark skin, dark hair · New mum. Anxious and tired; worried about her baby.", tests: "Pregnancy and breastfeeding, reassurance" },
  "felix-romano": { name: "Felix Romano", kind: "patient", about: "Man, 38, dark hair, stubble, shirt with a pocket · Picking up for his dad. Helpful, but he's not the patient.", tests: "Agents, privacy and consent" },
  "dr-holt": { name: "Dr Holt", kind: "prescriber", about: "Woman, 50s, brown bob, glasses, white coat · GP. Busy but fair; listens if you're clear and brief. Easy pushback." },
  "dr-kapoor": { name: "Dr Kapoor", kind: "prescriber", about: "Man, 40s, stubble, scrubs and scrub cap · After-hours locum. Rushed, short answers, between patients. Medium pushback." },
  "dr-tan": { name: "Dr Tan", kind: "prescriber", about: "Woman, 40s, long black hair, white coat · Hospital consultant. Firm; wants a reason and a clear plan. Hard pushback." },
} as const;

export type CastId = keyof typeof CAST;
export const CAST_IDS = Object.keys(CAST) as [CastId, ...CastId[]];

/**
 * The animal cast's ids, which saved drafts and old case files may still use, mapped to the
 * character who took over each part. The case schema reads these as the new ids.
 */
export const OLD_CAST_IDS: Record<string, CastId> = {
  "bertie-bear": "bertie-walsh",
  "kiki-koala": "kiki-nguyen",
  "wally-wombat": "wally-morris",
  "rosie-rabbit": "rosie-costa",
  "penny-penguin": "penny-okafor",
  "felix-fox": "felix-romano",
  "dr-hoot": "dr-holt",
  "dr-kip": "dr-kapoor",
  "dr-tusk": "dr-tan",
};

/** Used when a persona doesn't name a character. */
export function defaultAvatar(standing: "public" | "professional"): CastId {
  return standing === "professional" ? "dr-holt" : "bertie-walsh";
}
