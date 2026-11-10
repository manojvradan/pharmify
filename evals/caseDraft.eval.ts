import { describe, expect, it } from "vitest";
import { draftCase } from "@/lib/bot/cases";

/**
 * Live check of the WhatsApp bot's question drafting: one real model call (plus fixes if
 * the checks fail). Costs API credits, so it only runs with `npm run eval`.
 */
const QUESTION = `Question sheet: Mrs Doris Patel, 72, presents a new prescription from an after-hours GP for clarithromycin 500 mg twice daily for 7 days for a chest infection. Her dispensing history shows simvastatin 80 mg at night (last filled 3 weeks ago) and amlodipine 5 mg daily. Manage the situation as you would in practice. You may contact the prescriber.

Hidden information: She takes the simvastatin every night. She has no allergies. She has had muscle aches before when her statin dose was increased.

Model answer: Identify the clarithromycin–simvastatin interaction (CYP3A4 inhibition, risk of myopathy/rhabdomyolysis). Contact the prescriber and recommend either withholding simvastatin for the course of clarithromycin and restarting 2 days after, or switching the antibiotic (e.g. doxycycline or amoxicillin as appropriate). Counsel on withholding, restarting, and reporting muscle pain or dark urine.`;

describe("case drafting (live)", () => {
  it("drafts a valid case from pasted text", { timeout: 600_000 }, async () => {
    const started = Date.now();
    const d = await draftCase({ source: { kind: "text", text: QUESTION }, sentBy: "eval" });
    console.log(`drafted in ${Math.round((Date.now() - started) / 1000)} s`);
    console.log(JSON.stringify({ id: d.record.id, category: d.record.category, assumptions: d.assumptions, problems: d.problems }, null, 2));
    console.log(JSON.stringify(d.record.hiddenFacts.map((f) => ({ id: f.id, agent: f.agent, triggers: f.triggers })), null, 2));
    expect(d.problems).toEqual([]);
    expect(d.record.category).toBe("clinical");
    expect(d.record.agents.prescriber).toBeDefined();
  });
});
