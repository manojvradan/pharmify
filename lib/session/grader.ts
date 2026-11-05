import "server-only";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { GRADER_MODEL, anthropic } from "@/lib/anthropic";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { unlockedFacts } from "./factGate";
import { FAIL_CONDITIONS, GraderReport, SKILLS, type Debrief, type Moment } from "./report";

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

function clock(t: number) {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Lowercase, straight quotes, single spaces: so a copied quote matches despite typography. */
function flat(s: string) {
  return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

/**
 * Keeps only moments whose quote really appears in a turn by that speaker in that
 * conversation, and takes the time from the turn itself rather than the model.
 */
export function anchorMoments(moments: Moment[], transcripts: Partial<Record<AgentId, Turn[]>>): Moment[] {
  const out: Moment[] = [];
  for (const m of moments) {
    const quote = flat(m.quote).replace(/^["']|["']$/g, "").replace(/\.{3}|…/g, "").trim();
    if (!quote) continue;
    const turn = transcripts[m.agent]?.find((t) => t.role === m.speaker && flat(t.text).includes(quote));
    if (turn) out.push({ ...m, time: clock(turn.t) });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
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
): Promise<Debrief> {
  const found = new Set(
    (Object.entries(transcripts) as [AgentId, Turn[]][]).flatMap(([agent, turns]) =>
      unlockedFacts(c, agent, turns).map((u) => u.factId),
    ),
  );
  const facts = c.hiddenFacts.map((f) => ({
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

<hidden_facts>
${facts.map((f) => `- ${f.fact} (${f.found ? "the candidate uncovered this" : "the candidate did NOT uncover this"})`).join("\n") || "None in this case."}
</hidden_facts>

<transcript time_used="${clock(timeUsed)}">
${renderTranscript(c, transcripts) || "The candidate did not say anything."}
</transcript>

Mark this session.`;

  const response = await anthropic().beta.messages.parse({
    model: GRADER_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(GraderReport) },
    system: GRADER_SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Grader returned no report (stop_reason: ${response.stop_reason})`);
  }

  const report = response.parsed_output;
  report.failConditions = report.failConditions.map((f) => ({ ...f, moments: anchorMoments(f.moments, transcripts) }));

  return {
    caseTitle: c.title,
    problemType: c.problemType,
    draft: c.review.status !== "reviewed",
    timeUsed,
    report,
    facts,
  };
}
