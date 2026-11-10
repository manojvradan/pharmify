import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import mammoth from "mammoth";
import { z } from "zod";
import atorvastatin from "@/data/cases/atorvastatin-doubling-up.json";
import glp1 from "@/data/cases/glp1-shortage.json";
import { anthropic } from "@/lib/anthropic";
import { CAST } from "@/lib/cast";
import { caseIds } from "@/lib/cases/bank";
import { ANSWER_SCHEME_MINIMUMS as MIN, answerSchemeProblems, checkCase } from "@/lib/cases/check";
import { CaseRecord } from "@/lib/cases/schema";
import { VOICE_LIBRARY } from "@/lib/voice/voices";
import { downloadMedia } from "./whatsapp";

/** Drafting a whole case is the bot's hardest job, so it gets the strongest model. */
export const CASE_MODEL = process.env.BOT_CASE_MODEL ?? "claude-opus-5-5";
/** Model attempts per draft: the first, plus fixes when the checks find problems. */
const ATTEMPTS = 3;

/** What the person sent to make a question from. */
export type CaseSource =
  | { kind: "text"; text: string }
  | { kind: "media"; mediaId: string; mimeType?: string; filename?: string; caption?: string };

/** The model writes everything except review status and sources, which the bot sets. */
const DraftCase = CaseRecord.omit({ review: true, sources: true });
const DraftOutput = z.object({
  /** One or two sentences on why the case is legal, ethical or complex clinical. Shown to the sender. */
  categoryReason: z.string(),
  case: DraftCase,
  /** Details the model had to make up because the document didn't say. Shown in the preview to check. */
  assumptions: z.array(z.string()),
});

export type CaseDraft = { record: CaseRecord; categoryReason: string; assumptions: string[]; problems: string[] };

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

/** Turns what was sent into content Claude can read: PDFs and photos directly, Word and text as text. */
async function sourceBlocks(source: CaseSource): Promise<Anthropic.ContentBlockParam[]> {
  if (source.kind === "text") return [{ type: "text", text: `<document>\n${source.text}\n</document>` }];
  const { bytes, mimeType: served } = await downloadMedia(source.mediaId);
  const mime = (source.mimeType ?? served).split(";")[0].trim().toLowerCase();
  const note = source.caption ? [{ type: "text" as const, text: `The sender's caption: ${source.caption}` }] : [];
  if (mime === "application/pdf") {
    return [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } }, ...note];
  }
  const image = IMAGE_TYPES.find((t) => t === mime);
  if (image) return [{ type: "image", source: { type: "base64", media_type: image, data: bytes.toString("base64") } }, ...note];
  if (mime === DOCX || source.filename?.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return [{ type: "text", text: `<document name="${source.filename ?? "document.docx"}">\n${value}\n</document>` }, ...note];
  }
  if (mime.startsWith("text/")) {
    return [{ type: "text", text: `<document name="${source.filename ?? "document.txt"}">\n${bytes.toString("utf8")}\n</document>` }, ...note];
  }
  throw new Error(`I can't read ${source.filename ?? mime} files. Send a PDF, a Word document (.docx), a photo, or paste the text.`);
}

const castList = Object.entries(CAST)
  .map(([id, c]) => `- ${id} (${c.kind}): ${c.name}. ${c.about}`)
  .join("\n");
const voiceList = Object.entries(VOICE_LIBRARY)
  .map(([id, v]) => `- ${id}: ${v.note}`)
  .join("\n");

const SYSTEM = `You turn a pharmacy exam question into a case record for Pharmify, where Australian pharmacy interns practise for the Pharmacy Board's oral exam. An AI actor plays the patient and prescriber using only what the record gives it; a grader marks the intern against the answer key. Return the record and a list of your assumptions.

<how_cases_are_sat>
- category "clinical": a 20-minute role play. The intern reads the question sheet and documents, then talks to the patient (agents.patient) and can phone the prescriber (agents.prescriber, optional). The patient's openingLine is required.
- category "ethical" or "legal": the intern reads the case, then talks for 5 minutes about what they would do and why. No one replies, so everything the intern needs must be in questionSheet and documents. agents.patient is still required (it is the main person in the scenario); hiddenFacts may be empty.
</how_cases_are_sat>

<fields>
- id: short kebab-case slug of the topic, e.g. "warfarin-antibiotic-interaction".
- title: 2-4 words. problemType: the problem type or ethical/legal theme, e.g. "Drug interaction".
- setting: where it happens, e.g. "Community pharmacy, NSW".
- questionSheet: what the intern reads first, written like the exam's question sheet. Ends with the task, e.g. "Manage the situation as you would in practice. You may contact the prescriber."
- documents: prescription {item, directions, footer}, dispensingHistory [{item, date}], notes [string]. Include only what the question provides or clearly needs.
- agents.patient / agents.prescriber (persona):
  - label: shown on the switch, e.g. "Patient · Mrs T." or "Call the GP".
  - name: what they answer to, e.g. "Mrs T." or "Dr Nguyen". Never bracket placeholders like [GP] or [SURNAME]; invent a realistic name.
  - description: age, manner, health literacy, how they react to good and poor handling. This steers the actor's behaviour.
  - bio: identity details as label → value, so they can answer identity questions: Full name, Date of birth, Age, Address, Phone, Occupation (professionals: Full name, Role, Workplace). Identity only: never medicines, conditions, allergies, or anything from a hidden fact. Ages must match the documents; the current year is 2026. Phone numbers only from this fictional range: 0491 570 156, 0491 570 157, 0491 570 158, 0491 570 159, 0491 570 110, 0491 570 313, 0491 570 737, 0491 571 266, 0491 571 491, 0491 571 804, 0491 572 549, 0491 572 665, 0491 572 983.
  - situation: only if not the default (patient at the counter; prescriber phoned about their patient).
  - standing: "public" or "professional", only if not the default for the slot.
  - avatar: the cast character who draws them (they keep the persona's own name). Pick by age, gender and manner:
${castList}
  - voice: pick one matching age and gender:
${voiceList}
  - openingLine: their first words, said verbatim when the intern first turns to them. Natural spoken Australian English.
  - publicFacts: what they'd say without being asked or in answer to any basic question. Short sentences.
- hiddenFacts: what a strong intern must ask to find out. Each has id (kebab-case), agent, fact (as the persona knows it, e.g. "You still have the old tablets at home and have kept taking them."), triggers, and unlockHint (the question a strong intern would ask, in curly quotes).
- answerKey: plantedProblem, acceptableResolutions, unacceptableActions, counsellingPoints, codePrinciples, legal, modelAnswer. Grader-only.
</fields>

<category>
Decide the category from what the question actually tests, the way the Board's oral exam does, and explain it in categoryReason (one or two plain sentences):
- "clinical" (complex clinical): a patient-care problem that needs clinical reasoning and usually a conversation with the patient and prescriber: interactions, duplication, dosing, contraindications, adverse effects, monitoring, choosing or switching therapy.
- "ethical": a professional or ethical dilemma: confidentiality, consent, conscientious objection, conflicts of interest, fairness in supply, honesty and open disclosure, professional boundaries, duty of care to someone other than the patient.
- "legal": the problem is mainly whether something is lawful and what the law requires: prescription validity, scheduling and S8/S4D rules, forgery, record keeping, supply without a prescription, notification and reporting duties.
If the document names a category, use it unless the content clearly tests something else; then follow the content and say so in categoryReason. If a question mixes them, pick the one the answer mostly turns on.
</category>

<answer_scheme>
Every answer scheme must be comprehensive enough to mark a candidate against, never a sketch. All categories:
- plantedProblem: exactly what the candidate must identify, specifically.
- acceptableResolutions: at least ${MIN.all.acceptableResolutions} concrete actions a passing candidate takes.
- unacceptableActions: at least ${MIN.all.unacceptableActions} things that would fail or cause harm.
- modelAnswer: what an excellent candidate says and does, as connected steps an examiner can mark against, not a summary.
Complex clinical (modelAnswer at least ${MIN.clinical.modelAnswerWords} words): gather the information needed (the specific questions to ask the patient), identify and explain the problem (mechanism and clinical significance), the references to check (e.g. AMH, eTG, APF), contact the prescriber with a specific recommendation (medicine, dose, duration, and an alternative), counselling, monitoring and follow-up, and documentation. counsellingPoints: at least ${MIN.clinical.counsellingPoints}, each specific to this case (what to take or stop and when, side effects to watch for, when to seek help), never one-word headings.
Ethical (modelAnswer at least ${MIN.ethical.modelAnswerWords} words): name the dilemma, the people affected, the options and their consequences, the decision with its justification, how to communicate it, and documentation. codePrinciples: at least ${MIN.ethical.codePrinciples}, citing the Pharmacy Board's Code of Conduct or the PSA Code of Ethics. Add legal points where the law bears on it.
Legal (modelAnswer at least ${MIN.legal.modelAnswerWords} words): the legal issue, what the law requires and allows, the steps to take, who to notify or report to, documentation, and how to prevent it recurring. legal: at least ${MIN.legal.legal}, naming the legislation, regulation or standard (the state's, when the setting gives one, e.g. the Poisons and Therapeutic Goods Regulation 2008 (NSW)).
</answer_scheme>

<triggers>
A code matcher, not a model, unlocks hidden facts. A trigger matches when all of its words appear close together (within the trigger's length plus one word) in one sentence the intern says to that agent, after: lowercasing; dropping filler words (a, the, is, you, your, do, did, have, what, how, when, any, it, to, of, for, on, in, and, about, there, that, this, with, can, would, will...); and folding synonyms (medication/meds/medicines → medicine; pills/tabs/tablets → tablet; taking/took/using/use → take; told/said/say → tell; previous/before → old; gp/doctors → doctor; stopped → stop).
So:
- Write 8-15 triggers per fact, each 1-3 content words that interns naturally say when asking about that fact, covering different phrasings ("other medicine", "anything else", "blood thinner", "warfarin").
- Each trigger must contain at least one non-filler word, and must unlock its own fact when said alone.
- Avoid triggers so generic they'd fire on small talk or on an unrelated question (a lone "medicine", "doctor", "feel").
</triggers>

<faithfulness>
The document is the source of truth for the scenario and the answer. Keep its clinical details, numbers, doses and model answer exactly. Do not invent clinical facts that change the problem or the right answer. Where the record needs something the document doesn't give (names, bios, manner, opening lines, triggers, realistic supporting detail), fill it in plausibly, and list every such clinical or scenario detail in assumptions in plain words (you needn't list names, bios, avatar or voice choices). If the document has a marking guide or model answer, build answerKey from it; otherwise write the answer key from current Australian practice and say so in assumptions.
</faithfulness>

Here are two finished cases in the bank, as examples of style and detail:
<example>${JSON.stringify(atorvastatin)}</example>
<example>${JSON.stringify(glp1)}</example>`;

async function callModel(messages: Anthropic.Beta.BetaMessageParam[]) {
  const response = await anthropic().beta.messages.parse({
    model: CASE_MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: betaZodOutputFormat(DraftOutput) },
    // The instructions and examples are the same every time, so they stay in the prompt cache.
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  });
  if (!response.parsed_output) throw new Error(`Couldn't draft the question (${response.stop_reason})`);
  return response.parsed_output;
}

/**
 * Drafts a case from a document, or revises one with feedback, then runs the bank's checks
 * and asks the model to fix any problems they find. Problems left after the last attempt are
 * returned, and the bot won't publish until they're gone.
 */
export async function draftCase(
  input: { source: CaseSource; sentBy?: string } | { previous: CaseRecord; feedback: string },
): Promise<CaseDraft> {
  const messages: Anthropic.Beta.BetaMessageParam[] =
    "source" in input
      ? [{ role: "user", content: [...(await sourceBlocks(input.source)), { type: "text", text: "Make a case record from this question." }] }]
      : [
          {
            role: "user",
            content: `Here is a case record:\n${JSON.stringify(input.previous)}\n\nApply this change and keep everything else as it is (keep the id unless the change is about it). If the change is to the category, also rework the format and answer scheme to that category's rules:\n${input.feedback}`,
          },
        ];
  const existing = caseIds().filter((id) => "source" in input || id !== input.previous.id);
  const meta = {
    review: { status: "draft" as const, version: "0.1" },
    sources: "source" in input ? [`Drafted with the WhatsApp bot${input.sentBy ? ` from a document sent by ${input.sentBy}` : ""}`] : input.previous.sources,
  };

  let last: CaseDraft | undefined;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const out = await callModel(messages);
    const checked = checkCase({ ...out.case, ...meta }, existing);
    const record = checked.record;
    const problems = record ? [...checked.problems, ...answerSchemeProblems(record)] : checked.problems;
    if (record) last = { record, categoryReason: out.categoryReason, assumptions: out.assumptions, problems };
    if (record && problems.length === 0) return last!;
    messages.push(
      { role: "assistant", content: JSON.stringify(out) },
      { role: "user", content: `The bank's checks found these problems. Fix them and return the whole record again:\n${problems.map((p) => `- ${p}`).join("\n")}` },
    );
  }
  if (!last) throw new Error("Couldn't make a valid case from that. Try sending the question as text or a clearer file.");
  return last;
}

const TYPE_LABEL = { clinical: "Complex clinical", ethical: "Ethical", legal: "Legal" } as const;

/** The WhatsApp message that goes with a draft: what it is, what to check, and the preview link. */
export function caseSummary(d: CaseDraft, previewUrl: string): string {
  const c = d.record;
  const k = c.answerKey;
  const people = [c.agents.patient, c.agents.prescriber].filter((p) => p).map((p) => p!.name);
  const scheme = [
    `model answer (${k.modelAnswer.split(/\s+/).filter(Boolean).length} words)`,
    `${k.acceptableResolutions.length} things to do`,
    `${k.unacceptableActions.length} things to avoid`,
    k.counsellingPoints.length ? `${k.counsellingPoints.length} counselling points` : "",
    k.codePrinciples.length ? `${k.codePrinciples.length} Code principles` : "",
    k.legal.length ? `${k.legal.length} legal points` : "",
  ].filter(Boolean);
  const lines = [
    `📝 *${c.title}*`,
    "",
    `📂 *Type: ${TYPE_LABEL[c.category]}*`,
    d.categoryReason,
    "",
    `🎯 *What the candidate has to spot:* ${k.plantedProblem}`,
    "",
    c.category === "clinical"
      ? `🗣 *They'll talk to:* ${people.join(" and ")} (${c.hiddenFacts.length} things they only say if asked)`
      : "🗣 *Format:* the candidate reads the case and talks for 5 minutes",
    `✅ *Answer scheme:* ${scheme.join(", ")}`,
  ];
  if (d.assumptions.length) lines.push("", "*I had to fill these in, please check:*", ...d.assumptions.map((a) => `• ${a}`));
  if (d.problems.length) lines.push("", "⚠️ *Not ready yet, still missing:*", ...d.problems.map((p) => `• ${p}`));
  lines.push("", `👀 See everything (case papers, characters, full answer scheme):\n${previewUrl}`);
  lines.push("", 'Wrong type? Just reply, e.g. "this is ethical".');
  return lines.join("\n");
}
