/**
 * The cast: the animal characters who play patients and prescribers. Drawings are in
 * components/CastAvatar.tsx; this file holds only ids and descriptions, so case data
 * and the case schema can refer to a character without importing any React.
 * Source: the "Pharmify cast" design sheet.
 */

export const CAST = {
  "bertie-bear": { name: "Bertie Bear", kind: "patient", about: "72 · Retired postie. Warm and chatty; forgets which tablets he's already taking." },
  "kiki-koala": { name: "Kiki Koala", kind: "patient", about: "20 · Uni student. Sleepy, vague answers; needs things explained simply." },
  "wally-wombat": { name: "Wally Wombat", kind: "patient", about: "45 · Tradie. Gruff and in a hurry; wants to be in and out." },
  "rosie-rabbit": { name: "Rosie Rabbit", kind: "patient", about: "68 · Grandmother. Loves a chat; takes a lot of medicines from different doctors." },
  "penny-penguin": { name: "Penny Penguin", kind: "patient", about: "31 · New mum. Anxious and tired; worried about her baby." },
  "felix-fox": { name: "Felix Fox", kind: "patient", about: "38 · Picking up for his dad. Helpful, but he's not the patient." },
  "dr-hoot": { name: "Dr Hoot", kind: "prescriber", about: "Owl · GP. Busy but fair; listens if you're clear and brief. Easy pushback." },
  "dr-kip": { name: "Dr Kip", kind: "prescriber", about: "Kangaroo · After-hours locum. Rushed, short answers. Medium pushback." },
  "dr-tusk": { name: "Dr Tusk", kind: "prescriber", about: "Elephant · Hospital consultant. Firm; wants a reason and a clear plan. Hard pushback." },
} as const;

export type CastId = keyof typeof CAST;
export const CAST_IDS = Object.keys(CAST) as [CastId, ...CastId[]];

/** Used when a persona doesn't name a character. */
export function defaultAvatar(standing: "public" | "professional"): CastId {
  return standing === "professional" ? "dr-hoot" : "bertie-bear";
}
