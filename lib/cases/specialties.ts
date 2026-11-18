/**
 * The specialties complex clinical cases are grouped by on the clinical case hub
 * (app/(app)/clinical). Each case names one with `specialty` (lib/cases/schema.ts). `tint` is
 * the card's background and `bar` its accent, from the same soft palette as the home page's
 * category cards; icons are in components/SpecialtyIcon.tsx.
 */
export const SPECIALTIES = {
  cardiology: { label: "Cardiology", tint: "#FFE8F3", bar: "#FF8CC6" },
  endocrinology: { label: "Endocrinology", tint: "#FFF4D6", bar: "#FFC94D" },
  "infectious-disease": { label: "Infectious disease", tint: "#E3F7F0", bar: "#5FC3A9" },
  respiratory: { label: "Respiratory", tint: "#E6F0FF", bar: "#7FA8F0" },
  neurology: { label: "Neurology", tint: "#EFE6FF", bar: "#B99CF5" },
  "mental-health": { label: "Mental health", tint: "#FFEFE3", bar: "#FF9F6B" },
  dermatology: { label: "Dermatology", tint: "#FBEAE4", bar: "#E8957A" },
  rheumatology: { label: "Rheumatology", tint: "#EAF4DC", bar: "#93C562" },
  oncology: { label: "Oncology", tint: "#F3E6F7", bar: "#C987D9" },
  gastroenterology: { label: "Gastroenterology", tint: "#FFF0D9", bar: "#F0A93C" },
} as const;

export type SpecialtyId = keyof typeof SPECIALTIES;
export const SPECIALTY_IDS = Object.keys(SPECIALTIES) as [SpecialtyId, ...SpecialtyId[]];
