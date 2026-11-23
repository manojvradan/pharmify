import { Suspense } from "react";
import { CaseHub, type HubCaseCard, type HubCaseProgress, type HubCategory } from "@/components/CaseHub";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";
import { SPECIALTIES, type SpecialtyId } from "@/lib/cases/specialties";
import { getViewerSessions } from "@/lib/session/viewer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Every case in a category, as the hub's cards show it. Nothing here may give away what the case
 * tests: no problem type (for ethical and legal cases that's the theme), and titles say what the
 * patient comes in with. Complex clinical cases are only listed once they have a specialty.
 */
function hubCases(category: HubCategory): HubCaseCard[] {
  return caseIds()
    .map((id) => getCase(id)!)
    .filter((c) => c.category === category && (category !== "clinical" || c.specialty))
    .map((c) => {
      const patient = toPublic(c).agents.find((a) => a.id === "patient");
      const age = c.agents.patient.bio?.Age?.match(/\d+/)?.[0];
      return {
        id: c.id,
        title: c.title,
        specialty: c.specialty,
        summary: c.questionSheet,
        who: [c.agents.patient.name, age].filter(Boolean).join(", "),
        avatar: patient?.avatar ?? "bertie-walsh",
        setting: c.setting,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** How the signed-in candidate has done on each case: tries and whether any passed. */
async function HubWithProgress({
  category,
  cases,
  searchParams,
}: {
  category: HubCategory;
  cases: HubCaseCard[];
  searchParams: SearchParams;
}) {
  const asked = (await searchParams).specialty;
  const specialty =
    category === "clinical" && typeof asked === "string" && asked in SPECIALTIES ? (asked as SpecialtyId) : null;
  const sessions = (await getViewerSessions()) ?? [];
  const progress: Record<string, HubCaseProgress> = {};
  for (const s of sessions) {
    if (!s.debrief) continue;
    const p = (progress[s.caseId] ??= { tries: 0, passed: false });
    p.tries++;
    if (s.debrief.report.result === "pass") p.passed = true;
  }
  return <CaseHub category={category} cases={cases} progress={progress} initialSpecialty={specialty} />;
}

/** The page behind /clinical, /ethical and /legal. */
export function CaseHubPage({ category, searchParams }: { category: HubCategory; searchParams: SearchParams }) {
  const cases = hubCases(category);
  return (
    <Suspense fallback={<CaseHub category={category} cases={cases} progress={null} />}>
      <HubWithProgress category={category} cases={cases} searchParams={searchParams} />
    </Suspense>
  );
}
