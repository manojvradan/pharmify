import "server-only";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { GRADER_MODEL, anthropic } from "@/lib/anthropic";
import { caseFormat } from "@/lib/cases/format";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { unlockedFacts } from "./factGate";
import { FAIL_CONDITIONS, GraderReport, SKILLS, type Debrief } from "./report";
import { ReportShapeError, clock, finaliseReport } from "./reportGuards";
import type { UsageRecord } from "./store";

const GRADER_SYSTEM = `You are an independent marker for a practice version of the Pharmacy Board of Australia intern oral exam (Part C: problem solving and communication). You did not take part in the role play. You read the full transcript and the case's answer key, then mark the candidate.

Marking rules:
- Mark against the Board's four fail conditions (${FAIL_CONDITIONS.join("; ")}) and the competency checklist (${SKILLS.join("; ")}). Return every fail condition and every skill exactly once. Use "not_applicable" for a skill only when the case gives no chance to show it (for example, no prescriber to contact).
- Base every judgement on what the candidate actually said. Quote their words with the mm:ss time. Never credit something they did not say, and never mark them down for something the case did not allow.
- Use the answer key as the reference for clinical, legal and ethical facts. Do not add facts from your own knowledge.
- For each fail condition, list in \`moments\` the exact turns the result rests on, so the candidate can see where it was won or lost. Copy the quote word for word from one turn. If a fail comes from something the candidate never asked or said, point to the turn where they should have (for example, where they moved on to supply), or to the actor's reply that shows the gap.
- "pass" overall only if every fail condition is a pass.
- Counselling: return each counselling point from the answer key, marked covered or not.
- Focus: name the one thing that would most improve this candidate's result next time. Put the replay that shows it first.
- Replays: pick the two or three candidate turns that mattered most to the result. Quote the candidate exactly, and give a short model line they could have said instead.
- Write to the candidate in plain, encouraging but honest language, like a good preceptor. No jargon they wouldn't use. This is practice feedback, not a predicted exam result.`;

/**
 * Ethical and legal cases: no role play. The candidate read the case and spoke for up to
 * five minutes, uninterrupted, about what they would do. Same report shape as role plays.
 */
const EXPLAIN_GRADER_SYSTEM = `You are an independent marker for a practice version of the Pharmacy Board of Australia intern oral exam. This is an ethical or legal case: there was no role play. The candidate read the case, then spoke for up to five minutes, uninterrupted, explaining what they would do in that situation and why. You read their answer (a transcript of their speech, in timed segments) and the case's answer key, then mark it.

Marking rules:
- Judge the answer as a plan of action. A strong answer identifies the ethical or legal problem, gathers or names the information needed, weighs the options against the relevant principles and law, chooses and justifies a course of action, explains how they would communicate it, and covers documentation and follow-up or prevention.
- Mark against the Board's four fail conditions (${FAIL_CONDITIONS.join("; ")}) and the competency checklist (${SKILLS.join("; ")}). Return every fail condition and every skill exactly once. Read the skills as what the answer shows: "History taking" is the information they say they would gather; "Prescriber contacted well" is whether and how they would involve the prescriber or other professionals; "Clear counselling" is how they would explain the decision to the people involved. Use "not_applicable" only when the case gives no reason to show that skill.
- An answer that would supply, act or omit something the answer key lists as unacceptable fails the relevant condition.
- Base every judgement on what the candidate actually said. Never credit something they did not say. Spoken answers are transcribed automatically, so ignore filler words and small transcription slips.
- Use the answer key as the reference for ethical, legal and professional facts. Do not add facts from your own knowledge.
- For each fail condition, list in \`moments\` the parts of the answer the result rests on. Copy the quote word for word from one segment. Use agent "patient" and speaker "candidate" for every moment. If a fail comes from something they never said, leave \`moments\` empty and say what was missing in \`evidence\`.
- "pass" overall only if every fail condition is a pass.
- Counselling: return each counselling point from the answer key, marked covered if the answer says they would tell the person this.
- Focus: name the one thing that would most improve this answer next time. Put the replay that shows it first.
- Replays: pick the two or three parts of the answer that mattered most. Quote the candidate exactly (agent "patient"), and give a model line they could have said instead. If the most important problem is something left out, quote the nearest part of the answer and give the missing line as the model.
- Write to the candidate in plain, encouraging but honest language, like a good preceptor. No jargon they wouldn't use. This is practice feedback, not a predicted exam result.`;

function renderAnswer(turns: Turn[]) {
  return [...turns]
    .filter((t) => t.role === "candidate")
    .sort((a, b) => a.t - b.t)
    .map((t) => `[${clock(t.t)}] ${t.text}`)
    .join("\n");
}

function renderTranscript(c: CaseRecord, transcripts: Partial<Record<AgentId, Turn[]>>) {
  return (Object.entries(transcripts) as [AgentId, Turn[]][])
    .filter(([, turns]) => turns.length > 0)
    .map(([agent, turns]) => {
      const who = agent === "patient" ? c.agents.patient.name : (c.agents.prescriber?.name ?? "Prescriber");
      const lines = turns.map((t) => `[${clock(t.t)}] ${t.role === "candidate" ? "Candidate" : who}: ${t.text}`);
      return `<conversation with="${agent}">\n${lines.join("\n")}\n</conversation>`;
    })
    .join("\n\n");
}

export async function gradeSession(
  c: CaseRecord,
  transcripts: Partial<Record<AgentId, Turn[]>>,
  timeUsed: number,
): Promise<{ debrief: Debrief; usage: UsageRecord[] }> {
  const explain = caseFormat(c.category) === "explain";
  const found = new Set(
    (Object.entries(transcripts) as [AgentId, Turn[]][]).flatMap(([agent, turns]) =>
      unlockedFacts(c, agent, turns).map((u) => u.factId),
    ),
  );
  // Hidden facts are found by asking questions, so they don't apply when no one answers.
  const facts = (explain ? [] : c.hiddenFacts).map((f) => ({
    id: f.id,
    fact: f.fact,
    found: found.has(f.id),
    unlockHint: f.unlockHint,
  }));

  const userContent = `<case>
Title: ${c.title}
Category: ${c.category}
Problem type: ${c.problemType}
Setting: ${c.setting}
Question sheet: ${c.questionSheet}
Documents: ${JSON.stringify(c.documents)}
</case>

<answer_key>
${JSON.stringify(c.answerKey, null, 2)}
</answer_key>

${
  explain
    ? `<answer time_used="${clock(timeUsed)}">
${renderAnswer(transcripts.patient ?? []) || "The candidate did not say anything."}
</answer>`
    : `<hidden_facts>
${facts.map((f) => `- ${f.fact} (${f.found ? "the candidate uncovered this" : "the candidate did NOT uncover this"})`).join("\n") || "None in this case."}
</hidden_facts>

<transcript time_used="${clock(timeUsed)}">
${renderTranscript(c, transcripts) || "The candidate did not say anything."}
</transcript>`
}

Mark this session.`;

  const request = () =>
    anthropic().beta.messages.parse({
      model: GRADER_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: betaZodOutputFormat(GraderReport) },
      system: explain ? EXPLAIN_GRADER_SYSTEM : GRADER_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

  // One retry if the report comes back without a required section.
  let report;
  const usage: UsageRecord[] = [];
  for (let attempt = 1; ; attempt++) {
    const started = performance.now();
    const response = await request();
    usage.push({ kind: "grader", model: response.model, usage: response.usage, durationMs: performance.now() - started });
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new Error(`Grader returned no report (stop_reason: ${response.stop_reason})`);
    }
    try {
      report = finaliseReport(response.parsed_output, c, transcripts);
      break;
    } catch (err) {
      if (!(err instanceof ReportShapeError) || attempt >= 2) throw err;
      console.warn("[grader] regrading:", err.message);
    }
  }

  const debrief: Debrief = {
    caseTitle: c.title,
    problemType: c.problemType,
    draft: c.review.status !== "reviewed",
    timeUsed,
    format: explain ? "explain" : "roleplay",
    report,
    facts,
  };
  return { debrief, usage };
}
