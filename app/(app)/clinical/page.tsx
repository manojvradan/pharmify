import type { Metadata } from "next";
import { Suspense } from "react";
import {
  type ClinicalCaseCard,
  ClinicalHub,
  type ClinicalCaseProgress,
} from "@/components/ClinicalHub";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";
import { SPECIALTIES, type SpecialtyId } from "@/lib/cases/specialties";
import { getViewerSessions } from "@/lib/session/viewer";

export const metadata: Metadata = { title: "Complex clinical cases" };

/**
 * Every complex clinical case in the bank, as the hub's cards show it. Nothing here may give away
 * what the case tests: no problem type, and titles say what the patient comes in with.
 */
function clinicalCases(): ClinicalCaseCard[] {
  return caseIds()
    .map((id) => getCase(id)!)
    .filter((c) => c.category === "clinical" && c.specialty)
    .map((c) => {
      const patient = toPublic(c).agents.find((a) => a.id === "patient");
      const age = c.agents.patient.bio?.Age?.match(/\d+/)?.[0];
      return {
        id: c.id,
        title: c.title,
        specialty: c.specialty!,
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
  cases,
  searchParams,
}: {
  cases: ClinicalCaseCard[];
  searchParams: PageProps<"/clinical">["searchParams"];
}) {
  const asked = (await searchParams).specialty;
  const specialty =
    typeof asked === "string" && asked in SPECIALTIES
      ? (asked as SpecialtyId)
      : null;
  const sessions = (await getViewerSessions()) ?? [];
  const progress: Record<string, ClinicalCaseProgress> = {};
  for (const s of sessions) {
    if (!s.debrief) continue;
    const p = (progress[s.caseId] ??= { tries: 0, passed: false });
    p.tries++;
    if (s.debrief.report.result === "pass") p.passed = true;
  }
  return (
    <ClinicalHub
      cases={cases}
      progress={progress}
      initialSpecialty={specialty}
    />
  );
}

export default function ClinicalHubPage({
  searchParams,
}: PageProps<"/clinical">) {
  const cases = clinicalCases();
  return (
    <Suspense fallback={<ClinicalHub cases={cases} progress={null} />}>
      <HubWithProgress cases={cases} searchParams={searchParams} />
    </Suspense>
  );
}
