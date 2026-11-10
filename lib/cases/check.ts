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
