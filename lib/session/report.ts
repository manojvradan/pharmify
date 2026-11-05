import { z } from "zod";

/** The Board's four fail conditions, as named in the candidate guide. */
export const FAIL_CONDITIONS = [
  "Serious harm or injury",
  "Risk not reasonably minimised",
  "Practising legally and professionally",
  "Reasonable factual knowledge",
] as const;

/** Competency evidence checklist, adapted from Appendix 1 of the guide. */
export const SKILLS = [
  "History taking",
  "Issue identified",
  "Options considered",
  "Prescriber contacted well",
  "Clear counselling",
  "Prompt corrective action",
] as const;

/** One turn of the transcript that a judgement rests on. */
export const Moment = z.object({
  time: z.string().describe("mm:ss of the turn, copied from the transcript"),
  agent: z.enum(["patient", "prescriber"]).describe("Which conversation the turn is in"),
  speaker: z.enum(["candidate", "actor"]).describe("Who said it: usually the candidate; the actor when their reply shows what the candidate missed"),
  quote: z.string().describe("Words from that one turn, copied exactly. May be a shortened, contiguous part of the turn."),
  note: z.string().describe("One short sentence on why this moment mattered, to the candidate in the second person"),
});
export type Moment = z.infer<typeof Moment>;

/** What the grader model returns (structured output). */
export const GraderReport = z.object({
  result: z.enum(["pass", "not_yet"]),
  headline: z.string().describe("One short, plain line for the results title, e.g. “So close. One thing to fix.”"),
  summary: z
    .string()
    .describe("One or two short sentences to the candidate in the second person, e.g. “You spotted the duplicate and got the GP on side. Just one question let you down.”"),
  focus: z.object({
    title: z
      .string()
      .describe("The single most important thing to fix (or, on a pass, to sharpen), as a short imperative, e.g. “Always ask about other medicines”"),
    detail: z
      .string()
      .describe("One sentence on why it mattered in this case, e.g. “He takes warfarin, but you never asked, so the risk wasn't reasonably minimised.”"),
  }),
  failConditions: z.array(
    z.object({
      condition: z.enum(FAIL_CONDITIONS),
      result: z.enum(["pass", "fail"]),
      evidence: z
        .string()
        .describe("One or two plain sentences on why. Don't repeat the quotes from `moments` here."),
      moments: z
        .array(Moment)
        .describe(
          "The exact transcript turns behind this result, in time order: on a fail, the turns that caused it; on a pass, the turns that earned it. One to three, or empty if the result rests only on something never said.",
        ),
    }),
  ),
  skills: z.array(
    z.object({
      skill: z.enum(SKILLS),
      result: z.enum(["yes", "partly", "no", "not_applicable"]),
    }),
  ),
  counselling: z.array(z.object({ point: z.string(), covered: z.boolean() })),
  replays: z
    .array(
      z.object({
        time: z.string().describe("mm:ss of the candidate turn"),
        agent: z.enum(["patient", "prescriber"]),
        youSaid: z.string().describe("The candidate's words, quoted exactly from the transcript"),
        tryInstead: z.string().describe("A model line the candidate could have said instead"),
      }),
    )
    .describe("The first replay must be the moment that best illustrates `focus`."),
});
export type GraderReport = z.infer<typeof GraderReport>;

/** What the grade endpoint returns to the browser. */
export type Debrief = {
  caseTitle: string;
  problemType: string;
  draft: boolean;
  timeUsed: number;
  report: GraderReport;
  /** From the fact gate, not the grader: deterministic. */
  facts: { id: string; fact: string; found: boolean; unlockHint: string }[];
};
