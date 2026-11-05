import "server-only";

import atorvastatin from "@/data/cases/atorvastatin-doubling-up.json";
import cannabis from "@/data/cases/telehealth-cannabis.json";
import family from "@/data/cases/prescribing-for-family.json";
import { CaseRecord, type AgentId, type PublicCase } from "./schema";

/**
 * The question bank. To add a case: drop a JSON file in data/cases/ and list it here.
 * Every record is validated at load, so a malformed case fails the build, not a session.
 */
const RAW = [atorvastatin, cannabis, family];

const CASES: ReadonlyMap<string, CaseRecord> = new Map(
  RAW.map((raw) => {
    const parsed = CaseRecord.parse(raw);
    return [parsed.id, parsed] as const;
  }),
);

export function getCase(id: string): CaseRecord | undefined {
  return CASES.get(id);
}

export function caseIds(): string[] {
  return [...CASES.keys()];
}

export function toPublic(c: CaseRecord): PublicCase {
  const agents: PublicCase["agents"] = [
    { id: "patient", label: c.agents.patient.label, name: c.agents.patient.name, openingLine: c.agents.patient.openingLine },
  ];
  if (c.agents.prescriber) {
    agents.push({
      id: "prescriber",
      label: c.agents.prescriber.label,
      name: c.agents.prescriber.name,
      openingLine: c.agents.prescriber.openingLine,
    });
  }
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    setting: c.setting,
    questionSheet: c.questionSheet,
    documents: c.documents,
    agents,
    draft: c.review.status !== "reviewed",
  };
}

export function listPublicCases(): PublicCase[] {
  return [...CASES.values()].map(toPublic);
}

export function getPersona(c: CaseRecord, agent: AgentId) {
  return agent === "patient" ? c.agents.patient : c.agents.prescriber;
}
