/**
 * The cast: the animal characters who play patients and prescribers. Drawings are in
 * components/CastAvatar.tsx; this file holds only ids and descriptions, so case data
 * and the case schema can refer to a character without importing any React.
 * Source: the "Pharmify cast" design sheet. `tests` (patients only) is the skill each one
 * puts under pressure.
 */

export const CAST = {
  "bertie-bear": { name: "Bertie Bear", kind: "patient", about: "68 · Retired postie. Warm and chatty; forgets which tablets he's already taking.", tests: "Medication histories, doubling up" },
  "kiki-koala": { name: "Kiki Koala", kind: "patient", about: "20 · Uni student. Sleepy, vague answers; needs things explained simply.", tests: "Clear counselling, checking understanding" },
  "wally-wombat": { name: "Wally Wombat", kind: "patient", about: "45 · Tradie. Gruff and in a hurry; wants to be in and out.", tests: "Staying calm, getting key facts fast" },
  "rosie-rabbit": { name: "Rosie Rabbit", kind: "patient", about: "68 · Grandmother. Loves a chat; takes a lot of medicines from different doctors.", tests: "Interactions, multiple prescribers" },
  "penny-penguin": { name: "Penny Penguin", kind: "patient", about: "31 · New mum. Anxious and tired; worried about her baby.", tests: "Pregnancy and breastfeeding, reassurance" },
  "felix-fox": { name: "Felix Fox", kind: "patient", about: "38 · Picking up for his dad. Helpful, but he's not the patient.", tests: "Agents, privacy and consent" },
  "dr-hoot": { name: "Dr Hoot", kind: "prescriber", about: "Owl · GP. Busy but fair; listens if you're clear and brief. Easy pushback." },
  "dr-kip": { name: "Dr Kip", kind: "prescriber", about: "Kangaroo · After-hours locum. Rushed, short answers, between patients. Medium pushback." },
  "dr-tusk": { name: "Dr Tusk", kind: "prescriber", about: "Elephant · Hospital consultant. Firm; wants a reason and a clear plan. Hard pushback." },
} as const;

export type CastId = keyof typeof CAST;
export const CAST_IDS = Object.keys(CAST) as [CastId, ...CastId[]];

/** Used when a persona doesn't name a character. */
export function defaultAvatar(standing: "public" | "professional"): CastId {
  return standing === "professional" ? "dr-hoot" : "bertie-bear";
}
