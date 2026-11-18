import type { SpecialtyId } from "@/lib/cases/specialties";

/** One line icon per specialty, drawn on a 24px grid to match the home page's category icons. */
const PATHS: Record<SpecialtyId, string> = {
  cardiology: "M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0112 7.4a4.1 4.1 0 017.5 2.4C19.5 15.4 12 20 12 20zM7.5 12.5h2.2l1.4-2.4 2 4.6 1.4-2.2h2",
  endocrinology: "M12 3.5s6 6.4 6 10.8a6 6 0 01-12 0c0-4.4 6-10.8 6-10.8zM9.4 14.6a2.7 2.7 0 002.6 2.6",
  "infectious-disease":
    "M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.8 2.8M15.2 15.2L18 18M18 6l-2.8 2.8M8.8 15.2L6 18M11 11h.01M13.2 13.4h.01",
  respiratory:
    "M12 4v7.5M12 11.5c-1.2-.8-2.6-.6-3 0M12 11.5c1.2-.8 2.6-.6 3 0M9 8.2C6.2 8 4.2 11.8 4.2 16.2c0 2 1.4 3 2.9 2.5C9 18 9 15.8 9 13.8V8.2zM15 8.2c2.8-.2 4.8 3.6 4.8 8 0 2-1.4 3-2.9 2.5C15 18 15 15.8 15 13.8V8.2z",
  neurology:
    "M11 4.5H9.6A2.9 2.9 0 006.8 7.4 2.9 2.9 0 004.6 12a2.9 2.9 0 002.2 4.6 2.9 2.9 0 002.8 2.9H11zM13 4.5h1.4a2.9 2.9 0 012.8 2.9 2.9 2.9 0 012.2 4.6 2.9 2.9 0 01-2.2 4.6 2.9 2.9 0 01-2.8 2.9H13zM8 10.5c1 0 1.8.6 2 1.5M16 10.5c-1 0-1.8.6-2 1.5",
  "mental-health":
    "M9 20.5v-3.2C6.6 16 5 13.6 5 11a7 7 0 0114 0v.6l1.5 2.6-1.5.5v2.1a2 2 0 01-2 2h-2v1.7M11.7 8.6c.6-.9 2.3-.7 2.3.6 0 1.2-2.3 2.6-2.3 2.6s-2.3-1.4-2.3-2.6c0-1.3 1.7-1.5 2.3-.6z",
  dermatology: "M3.5 10.5c2.8-1.8 5.7 1.8 8.5 0s5.7-1.8 8.5 0M3.5 14.5h17M3.5 18.5h17M8 10V5.5M12 9.2V4.5M16 10V6",
  rheumatology:
    "M8.2 4.2a2.1 2.1 0 012.7 2.7l6.2 6.2a2.1 2.1 0 012.7 2.7 2.1 2.1 0 01-1.6 3.4 2.1 2.1 0 01-3.4 1.6 2.1 2.1 0 01-2.7-2.7L6 11.9a2.1 2.1 0 01-2.7-2.7 2.1 2.1 0 011.6-3.4 2.1 2.1 0 013.3-1.6z",
  oncology: "M12 3.5a3 3 0 00-3 3c0 2.4 2 5.2 5.6 12M12 3.5a3 3 0 013 3c0 2.4-2 5.2-5.6 12M9.4 18.5L8 21M14.6 18.5L16 21",
  gastroenterology:
    "M9.5 3.5v3.2c0 1.8-2.5 2.2-3.6 4.6-1.4 3 .3 7.6 5 8.4 4.4.8 8-1.4 8-5.6 0-3-2.6-4.7-4.6-3.9-1.4.6-1.8 2.4-3.4 2.2",
};

export function SpecialtyIcon({ id, size = 22 }: { id: SpecialtyId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PATHS[id]} stroke="#16112A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
