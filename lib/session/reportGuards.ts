import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { FAIL_CONDITIONS, SKILLS, type GraderReport, type Moment } from "./report";

/**
 * Deterministic checks on the grader's output. The model writes the judgement;
 * this code makes sure the report's structure and quotes are true to the case
 * and the transcript before a candidate sees it. Kept free of `server-only` so
 * it can be unit tested.
 */

type Transcripts = Partial<Record<AgentId, Turn[]>>;

/** The report is missing something we can't fill in ourselves; the caller should regrade. */
export class ReportShapeError extends Error {}

export function clock(t: number) {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Lowercase, straight quotes, single spaces: so a copied quote matches despite typography. */
function flat(s: string) {
  return s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

function cleanQuote(q: string) {
  return flat(q)
    .replace(/^["']+|["']+$/g, "")
    .replace(/\.{3}|…/g, "")
    .trim();
}

/** The turn by that speaker in that conversation that contains the quote, if any. */
function findTurn(transcripts: Transcripts, agent: AgentId, speaker: Turn["role"], quote: string) {
  const q = cleanQuote(quote);
  if (!q) return undefined;
  return transcripts[agent]?.find((t) => t.role === speaker && flat(t.text).includes(q));
}

/**
 * Keeps only moments whose quote really appears in a turn by that speaker in that
 * conversation, and takes the time from the turn itself rather than the model.
 */
export function anchorMoments(moments: Moment[], transcripts: Transcripts): Moment[] {
  const out: Moment[] = [];
  for (const m of moments) {
    const turn = findTurn(transcripts, m.agent, m.speaker, m.quote);
    if (turn) out.push({ ...m, time: clock(turn.t) });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** One entry per expected key, in the expected order. Throws if any is missing. */
function exactlyOnce<T, K extends string>(items: T[], keys: readonly K[], keyOf: (t: T) => K, what: string): T[] {
  const byKey = new Map<K, T>();
  for (const item of items) if (!byKey.has(keyOf(item))) byKey.set(keyOf(item), item);
  const missing = keys.filter((k) => !byKey.has(k));
  if (missing.length) throw new ReportShapeError(`Grader report is missing ${what}: ${missing.join(", ")}`);
  return keys.map((k) => byKey.get(k)!);
}

export function finaliseReport(report: GraderReport, c: CaseRecord, transcripts: Transcripts): GraderReport {
  const failConditions = exactlyOnce(report.failConditions, FAIL_CONDITIONS, (f) => f.condition, "fail conditions").map(
    (f) => ({ ...f, moments: anchorMoments(f.moments, transcripts) }),
  );
  const skills = exactlyOnce(report.skills, SKILLS, (s) => s.skill, "skills");

  // The Board's rule, enforced in code: any failed condition means not yet a pass.
  const result = failConditions.every((f) => f.result === "pass") ? "pass" : "not_yet";

  // Counselling follows the answer key exactly: its points, its order. A point the grader skipped counts as not covered.
  const marked = new Map(report.counselling.map((p) => [flat(p.point), p.covered]));
  const counselling = c.answerKey.counsellingPoints.map((point) => ({ point, covered: marked.get(flat(point)) ?? false }));

  // Replays must quote the candidate exactly; the time comes from the transcript.
  const replays = report.replays.flatMap((r) => {
    const turn = findTurn(transcripts, r.agent, "candidate", r.youSaid);
    return turn ? [{ ...r, time: clock(turn.t) }] : [];
  });

  return { ...report, result, failConditions, skills, counselling, replays };
}
