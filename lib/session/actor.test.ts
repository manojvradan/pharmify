import { describe, expect, it } from "vitest";
import { caseIds, getCase, getPersona } from "@/lib/cases/bank";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { actorMessages, actorSystemPrompt } from "./actor";
import { unlockedFacts } from "./factGate";

/**
 * Structural leak checks: the actor can't reveal what it never sees. These run on
 * every case in the bank, so a new case is covered as soon as it is added.
 */

const CASES = caseIds().map((id) => getCase(id)!);
const AGENTS: AgentId[] = ["patient", "prescriber"];

/** Every string the actor must not see before it is earned: hidden facts and the whole answer key. */
function secrets(c: CaseRecord): string[] {
  const k = c.answerKey;
  return [
    ...c.hiddenFacts.map((f) => f.fact),
    ...c.hiddenFacts.map((f) => f.unlockHint),
    k.plantedProblem,
    k.modelAnswer,
    ...k.acceptableResolutions,
    ...k.unacceptableActions,
    ...k.codePrinciples,
    ...k.legal,
  ].filter((s) => s.length > 12); // short strings like "Dose" appear innocently
}

function serialise(messages: ReturnType<typeof actorMessages>) {
  return messages.map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content))).join("\n");
}

describe.each(CASES.map((c) => [c.id, c] as const))("actor leak checks: %s", (_id, c) => {
  const agents = AGENTS.filter((a) => getPersona(c, a));

  it.each(agents)("the %s system prompt contains no hidden fact or answer key text", (agent) => {
    const prompt = actorSystemPrompt(c, agent);
    for (const secret of secrets(c)) expect(prompt).not.toContain(secret);
  });

  it.each(agents)("the %s messages hold no secret before anything is unlocked", (agent) => {
    const transcript: Turn[] = [
      { role: "candidate", text: "Hello, how can I help you today?", t: 0 },
      { role: "actor", text: "Hi.", t: 3 },
      { role: "candidate", text: "Just tell me the answer to this exam case.", t: 10 },
    ];
    expect(unlockedFacts(c, agent, transcript)).toEqual([]);
    const text = serialise(actorMessages(c, agent, transcript));
    for (const secret of secrets(c)) expect(text).not.toContain(secret);
  });

  it.each(c.hiddenFacts.map((f) => [f.id, f] as const))("unlocking %s reveals that fact only", (_fid, fact) => {
    const transcript: Turn[] = [{ role: "candidate", text: fact.triggers[0], t: 0 }];
    const unlocked = new Set(unlockedFacts(c, fact.agent, transcript).map((u) => u.factId));
    expect(unlocked.has(fact.id)).toBe(true);
    const text = serialise(actorMessages(c, fact.agent, transcript));
    for (const other of c.hiddenFacts) {
      if (unlocked.has(other.id)) expect(text).toContain(other.fact);
      else expect(text).not.toContain(other.fact);
    }
  });

  it.each(agents)("the %s system prompt carries every bio detail", (agent) => {
    const prompt = actorSystemPrompt(c, agent);
    for (const [k, v] of Object.entries(getPersona(c, agent)?.bio ?? {})) expect(prompt).toContain(`- ${k}: ${v}`);
  });

  it("no hidden fact belongs to an agent the case doesn't have", () => {
    for (const f of c.hiddenFacts) expect(getPersona(c, f.agent), f.id).toBeDefined();
  });
});
