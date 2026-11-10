import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { caseIds, getCase } from "./bank";
import { CASE_INDEX_PATH, renderCaseIndex } from "./caseIndex";
import { answerSchemeProblems, checkCase } from "./check";

describe("checkCase", () => {
  it.each(caseIds())("%s passes", (id) => {
    expect(checkCase(getCase(id)).problems).toEqual([]);
  });

  it("flags a duplicate id", () => {
    const c = getCase("atorvastatin-doubling-up")!;
    expect(checkCase(c, [c.id]).problems).toContain(`id "${c.id}" is already used by another case`);
  });

  it("flags a trigger that can't match and a leaked fact", () => {
    const c = structuredClone(getCase("atorvastatin-doubling-up")!);
    c.hiddenFacts[0].triggers.push("is it the");
    c.agents.patient.publicFacts.push(c.hiddenFacts[1].fact);
    const { problems } = checkCase(c);
    expect(problems.some((p) => p.includes('"is it the" is only filler words'))).toBe(true);
    expect(problems.some((p) => p.includes("give away hidden"))).toBe(true);
  });

  it("reports schema errors with their path", () => {
    expect(checkCase({ id: "Bad Id" }).problems.some((p) => p.startsWith("id:"))).toBe(true);
  });
});

describe("case index", () => {
  it("is up to date with data/cases (run `npm run cases:index`)", () => {
    expect(readFileSync(CASE_INDEX_PATH, "utf8")).toBe(renderCaseIndex(readdirSync("data/cases")));
  });
});

describe("answerSchemeProblems", () => {
  it("asks a terse clinical case for a fuller scheme", () => {
    const c = structuredClone(getCase("atorvastatin-doubling-up")!);
    c.answerKey.modelAnswer = "Contact the GP.";
    c.answerKey.counsellingPoints = ["Dose"];
    const problems = answerSchemeProblems(c);
    expect(problems.some((p) => p.includes("words in the model answer"))).toBe(true);
    expect(problems.some((p) => p.includes("counselling points"))).toBe(true);
  });

  it("asks an ethical case for Code principles and a legal case for legal requirements", () => {
    const ethical = structuredClone(getCase("glp1-shortage")!);
    ethical.answerKey.codePrinciples = [];
    expect(answerSchemeProblems(ethical).some((p) => p.includes("Code of Conduct"))).toBe(true);
    const legal = structuredClone(getCase("forged-s8-prescription")!);
    legal.answerKey.legal = [];
    expect(answerSchemeProblems(legal).some((p) => p.includes("legal requirements"))).toBe(true);
  });
});
