import "server-only";
import { AVATAR_VOICE } from "@/lib/voice/voices";
import { PART_SECONDS_BY_FORMAT, caseFormat } from "./format";

import aiTool from "@/data/cases/ai-risk-tool.json";
import atorvastatin from "@/data/cases/atorvastatin-doubling-up.json";
import bushMedicine from "@/data/cases/bush-medicine.json";
import objection from "@/data/cases/conscientious-objection-ecp.json";
import forgedS8 from "@/data/cases/forged-s8-prescription.json";
import glp1 from "@/data/cases/glp1-shortage.json";
import imipramine from "@/data/cases/imipramine-panic-disorder.json";
import mdma from "@/data/cases/mdma-sertraline.json";
import family from "@/data/cases/prescribing-for-family.json";
import cannabis from "@/data/cases/telehealth-cannabis.json";
import wrongPatient from "@/data/cases/wrong-patient-disclosure.json";
import { defaultAvatar } from "@/lib/cast";
import { CaseRecord, type AgentId, type PublicCase } from "./schema";

/**
 * The question bank. To add a case: drop a JSON file in data/cases/ and list it here.
 * Every record is validated at load, so a malformed case fails the build, not a session.
 */
const RAW = [
  // Clinical
  atorvastatin,
  imipramine,
  // Legal
  forgedS8,
  // Ethical
  bushMedicine,
  glp1,
  mdma,
  objection,
  aiTool,
  family,
  cannabis,
  wrongPatient,
];

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
  const format = caseFormat(c.category);
  const agents: PublicCase["agents"] = [];
  // Explain cases have no one to talk to, so no characters reach the browser.
  for (const id of format === "roleplay" ? (["patient", "prescriber"] as const) : []) {
    const p = getPersona(c, id);
    if (!p) continue;
    const standing = p.standing ?? (id === "patient" ? "public" : "professional");
    const avatar = p.avatar ?? defaultAvatar(standing);
    agents.push({ id, label: p.label, name: p.name, openingLine: p.openingLine, avatar, voice: p.voice ?? AVATAR_VOICE[avatar] });
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
    format,
    partSeconds: PART_SECONDS_BY_FORMAT[format],
  };
}

export function listPublicCases(): PublicCase[] {
  return [...CASES.values()].map(toPublic);
}

export function getPersona(c: CaseRecord, agent: AgentId) {
  return agent === "patient" ? c.agents.patient : c.agents.prescriber;
}
