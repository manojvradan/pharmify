import "server-only";

import { actorSystemPrompt } from "@/lib/session/actor";
import { normalise, unlockedFacts } from "@/lib/session/factGate";
import { getPersona } from "./bank";
import { caseFormat } from "./format";
import { type AgentId, CaseRecord } from "./schema";

/**
 * Checks a case before it joins the bank: the same guarantees lib/session/actor.test.ts
 * holds every case to, for one record at a time (the WhatsApp bot runs this on drafts).
 * Returns problems in plain words; an empty list means it passed.
 */
export function checkCase(raw: unknown, existingIds: Iterable<string> = []): { record?: CaseRecord; problems: string[] } {
  const parsed = CaseRecord.safeParse(raw);
  if (!parsed.success) {
    return { problems: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  const c = parsed.data;
  const problems: string[] = [];

  if (new Set(existingIds).has(c.id)) problems.push(`id "${c.id}" is already used by another case`);

  const agents = (["patient", "prescriber"] as AgentId[]).filter((a) => getPersona(c, a));
  for (const f of c.hiddenFacts) {
    if (!getPersona(c, f.agent)) problems.push(`hidden fact "${f.id}" belongs to ${f.agent}, but the case has no ${f.agent}`);
  }
  const ids = c.hiddenFacts.map((f) => f.id);
  for (const id of new Set(ids)) if (ids.filter((x) => x === id).length > 1) problems.push(`hidden fact id "${id}" is used twice`);

  // Every trigger must survive normalisation and, said on its own, unlock its fact.
  for (const f of c.hiddenFacts) {
    if (!getPersona(c, f.agent)) continue;
    for (const t of f.triggers) {
      if (normalise(t).length === 0) {
        problems.push(`hidden fact "${f.id}": trigger "${t}" is only filler words, so it can never match`);
        continue;
      }
      const unlocked = unlockedFacts(c, f.agent, [{ role: "candidate", text: t, t: 0 }]).map((u) => u.factId);
      if (!unlocked.includes(f.id)) problems.push(`hidden fact "${f.id}": trigger "${t}" doesn't unlock it`);
    }
  }

  // Nothing the actor must earn may sit in its system prompt from the start.
  const k = c.answerKey;
  const secrets = [
    ...c.hiddenFacts.map((f) => f.fact),
    ...c.hiddenFacts.map((f) => f.unlockHint),
    k.plantedProblem,
    k.modelAnswer,
    ...k.acceptableResolutions,
    ...k.unacceptableActions,
    ...k.codePrinciples,
    ...k.legal,
  ].filter((s) => s.length > 12);
  for (const agent of agents) {
    const prompt = actorSystemPrompt(c, agent);
    for (const s of secrets) {
      if (prompt.includes(s)) problems.push(`the ${agent}'s visible details give away hidden or answer-key text: "${s.slice(0, 80)}"`);
    }
  }

  if (caseFormat(c.category) === "roleplay" && !c.agents.patient.openingLine) {
    problems.push("a clinical (role-play) case needs agents.patient.openingLine");
  }
  return { record: c, problems };
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Minimums for a new question's answer scheme, by type. Stricter than the bank's own checks
 * (some older cases are terser): the WhatsApp bot holds every draft to these before it can
 * be approved, and the model is told the same rules.
 */
export const ANSWER_SCHEME_MINIMUMS = {
  all: { acceptableResolutions: 3, unacceptableActions: 2 },
  clinical: { modelAnswerWords: 200, counsellingPoints: 5 },
  ethical: { modelAnswerWords: 150, codePrinciples: 2 },
  legal: { modelAnswerWords: 150, legal: 2 },
} as const;

/** What's missing from a case's answer scheme for its type. Empty means it's complete. */
export function answerSchemeProblems(c: CaseRecord): string[] {
  const k = c.answerKey;
  const min = ANSWER_SCHEME_MINIMUMS;
  const problems: string[] = [];
  const need = (have: number, want: number, what: string) => {
    if (have < want) problems.push(`answer scheme: needs at least ${want} ${what} (has ${have})`);
  };
  need(k.acceptableResolutions.length, min.all.acceptableResolutions, "acceptable resolutions");
  need(k.unacceptableActions.length, min.all.unacceptableActions, "unacceptable actions");
  if (c.category === "clinical") {
    need(words(k.modelAnswer), min.clinical.modelAnswerWords, "words in the model answer for a complex clinical case");
    need(k.counsellingPoints.length, min.clinical.counsellingPoints, "specific counselling points");
  } else if (c.category === "ethical") {
    need(words(k.modelAnswer), min.ethical.modelAnswerWords, "words in the model answer");
    need(k.codePrinciples.length, min.ethical.codePrinciples, "Code of Conduct / Code of Ethics principles");
  } else {
    need(words(k.modelAnswer), min.legal.modelAnswerWords, "words in the model answer");
    need(k.legal.length, min.legal.legal, "specific legal requirements (legislation, regulations or standards)");
  }
  return problems;
}
