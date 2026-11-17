import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";

/**
 * The fact gate decides which hidden facts the candidate has earned.
 *
 * It runs in our code, not in a model, so the actor never sees a fact until it is
 * unlocked and cannot leak it. This version matches trigger phrases after light
 * normalisation (lowercase, synonyms, crude stemming), with the words close together in one sentence. It is deterministic and takes
 * microseconds. An embedding matcher can replace `matches()` later without changing callers.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "do", "does", "did", "you", "your",
  "yours", "i", "me", "my", "we", "us", "it", "its", "to", "of", "for", "on", "in", "at", "and",
  "or", "so", "any", "anything", "that", "this", "with", "from", "have", "has", "had", "can",
  "could", "would", "will", "just", "about", "there", "what", "which", "who", "how", "when",
  "if", "up", "out", "them", "they", "he", "she", "him", "her", "his", "now", "then",
]);

// Words kept even though they look like stopwords, because triggers depend on them.
const KEEP = new Set(["any", "anything", "else", "other", "both", "still", "stop", "two", "one"]);

const SYNONYMS: Record<string, string> = {
  medication: "medicine",
  medications: "medicine",
  meds: "medicine",
  medicines: "medicine",
  tablets: "tablet",
  pills: "tablet",
  pill: "tablet",
  tabs: "tablet",
  statins: "statin",
  doctors: "doctor",
  gp: "doctor",
  else: "else",
  taking: "take",
  takes: "take",
  took: "take",
  having: "have",
  using: "take",
  use: "take",
  told: "tell",
  telling: "tell",
  said: "tell",
  say: "tell",
  stopped: "stop",
  stopping: "stop",
  previous: "old",
  previously: "old",
  before: "old",
  current: "currently",
  intended: "intend",
  intention: "intend",
  meant: "intend",
  duplicated: "duplicate",
  duplication: "duplicate",
  thinners: "thinner",
};

export function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w)
    .filter((w) => KEEP.has(w) || !STOPWORDS.has(w));
}

/** Splits on sentence-ending punctuation and line breaks. Abbreviations like "Mr." only over-split, which is safe. */
function sentencesOf(text: string): string[] {
  return text.split(/[.!?;\n]+/).filter((s) => s.trim());
}

/**
 * True when every word of the trigger appears close together in the sentence: within
 * a window of the trigger's length plus one word, after normalising. "old tablets"
 * matches "your old cholesterol tablets" but not "one tablet at night, and stop the old ones".
 */
function matches(sentence: string[], trigger: string): boolean {
  const words = [...new Set(normalise(trigger))];
  if (words.length === 0) return false;
  const maxSpan = words.length; // (n - 1) between the outer words, plus one extra word
  for (let i = 0; i < sentence.length; i++) {
    if (!words.includes(sentence[i])) continue;
    const seen = new Set<string>();
    for (let j = i; j < sentence.length && j - i <= maxSpan; j++) {
      if (words.includes(sentence[j])) seen.add(sentence[j]);
      if (seen.size === words.length) return true;
    }
  }
  return false;
}

/**
 * Whether a piece of text touches a fact's triggers (same matcher as the gate). Used by
 * the actor eval to flag replies that mention a fact before it was unlocked.
 */
export function mentionsTrigger(text: string, triggers: string[]): boolean {
  const sentences = sentencesOf(text).map(normalise);
  return triggers.some((t) => sentences.some((words) => matches(words, t)));
}

/** The patient's full name as the bank has it: their bio, else the prescription. */
export function patientFullName(c: CaseRecord): string | undefined {
  const name = c.agents.patient.bio?.["Full name"] ?? c.documents.prescription?.patientName;
  return name?.replace(/\(.*?\)/g, "").trim() || undefined;
}

/** The patient's surname, normalised: what a caller must say before a prescriber knows who the call is about. */
export function patientSurname(c: CaseRecord): string | undefined {
  const words = normalise(patientFullName(c) ?? "");
  return words.at(-1);
}

/** Whether this agent starts the conversation not knowing which patient it is about. */
export function needsPatientNamed(c: CaseRecord, agent: AgentId): boolean {
  return agent === "prescriber" && !!c.agents.prescriber && !c.agents.prescriber.knowsPatient && !!patientSurname(c);
}

/**
 * The candidate turn in which the pharmacist first named the patient to this agent (their
 * surname, or a possessive like "Ryan's"). -1 when the agent knows the patient from the start;
 * null when they haven't been told yet.
 */
export function patientNamedAt(c: CaseRecord, agent: AgentId, transcript: Turn[]): number | null {
  if (!needsPatientNamed(c, agent)) return -1;
  const surname = patientSurname(c)!;
  const i = transcript.findIndex(
    (t) => t.role === "candidate" && normalise(t.text).some((w) => w === surname || w === `${surname}s`),
  );
  return i === -1 ? null : i;
}

export type UnlockEvent = { factId: string; fact: string; turnIndex: number };

/**
 * Walks one agent's transcript in order and returns each fact the first time a
 * candidate turn unlocks it. Pure and deterministic, so the server can recompute
 * it from the full history on every request instead of trusting the browser.
 */
export function unlockedFacts(c: CaseRecord, agent: AgentId, transcript: Turn[]): UnlockEvent[] {
  // A prescriber who doesn't yet know which patient the call is about can't answer about them.
  const namedAt = patientNamedAt(c, agent, transcript);
  if (namedAt === null) return [];
  const pending = c.hiddenFacts.filter((f) => f.agent === agent);
  const events: UnlockEvent[] = [];
  transcript.forEach((turn, turnIndex) => {
    if (turn.role !== "candidate" || turnIndex < namedAt || pending.length === 0) return;
    // A trigger must match inside one sentence, so words from unrelated sentences can't combine.
    const sentences = sentencesOf(turn.text).map(normalise);
    for (let i = pending.length - 1; i >= 0; i--) {
      const f = pending[i];
      if (f.triggers.some((t) => sentences.some((words) => matches(words, t)))) {
        events.push({ factId: f.id, fact: f.fact, turnIndex });
        pending.splice(i, 1);
      }
    }
  });
  return events;
}
