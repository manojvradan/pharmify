import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { Pip } from "@/components/Pip";
import { PipGrading } from "@/components/PipGrading";
import type { PublicCase } from "@/lib/cases/schema";

/** Shared by both session types: the role play (ExamSession) and the spoken answer (ExplainSession). */

export type Phase = "ready" | "live" | "grading" | "review";

export const CATEGORY_LABEL = { ethical: "Ethical", legal: "Legal", clinical: "Complex clinical" } as const;
const docLabel = "m-0 text-xs font-medium tracking-[0.05em] text-subtle uppercase";

export function clock(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** The examiner's only interjections: neutral time checks. */
export function timeCheck(remaining: number, partSeconds: number) {
  if (remaining <= 60) return "One minute remaining.";
  if (partSeconds > 300 && remaining <= 300) return "Five minutes remaining.";
  return null;
}

/** The question sheet and case documents, beside the stage. */
export function CaseDocuments({ c }: { c: PublicCase }) {
  return (
    <aside
      aria-label="Case documents"
      className="flex max-w-[400px] flex-[1_1_340px] flex-col gap-5 border-r border-line-soft bg-canvas p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className={docLabel}>Question sheet</h2>
        <p className="m-0 text-[15px]">{c.questionSheet}</p>
      </div>
      {c.documents.prescription && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4">
          <h2 className={docLabel}>Prescription</h2>
          <span className="font-semibold">{c.documents.prescription.item}</span>
          <span className="text-sm text-subtle">{c.documents.prescription.directions}</span>
          <span className="border-t border-line-soft pt-2 text-[13px] text-subtle">
            {c.documents.prescription.footer}
          </span>
        </div>
      )}
      {c.documents.dispensingHistory && c.documents.dispensingHistory.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 className={docLabel}>Dispensing history</h2>
          {c.documents.dispensingHistory.map((d, idx, all) => (
            <div
              key={`${d.item}-${d.date}`}
              className={`flex justify-between gap-3 py-2 text-sm ${idx < all.length - 1 ? "border-b border-line-soft" : ""}`}
            >
              <span>{d.item}</span>
              <span className="font-mono text-subtle">{d.date}</span>
            </div>
          ))}
        </div>
      )}
      {c.documents.notes && c.documents.notes.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 className={docLabel}>Notes</h2>
          {c.documents.notes.map((n) => (
            <p key={n} className="m-0 text-sm">
              {n}
            </p>
          ))}
        </div>
      )}
      {c.draft && (
        <p className="m-0 rounded-xl bg-sun-tint px-3 py-2 text-[13px] text-sun-deep">
          Draft case: not yet reviewed by a pharmacist.
        </p>
      )}
    </aside>
  );
}

/** Shown while the grader marks the session, or with a retry if it failed. */
export function GradingPanel({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      {error ? (
        <>
          <Pip mood="thinking" size={110} />
          <p className="m-0 font-semibold text-alert">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[52px] cursor-pointer rounded-2xl border-2 border-ink bg-sun px-6 font-bold text-ink shadow-pop"
          >
            Try marking again
          </button>
        </>
      ) : (
        <>
          <PipGrading />
          <h1 role="status" className="m-0 text-[clamp(24px,2.4vw,30px)] font-bold tracking-[-0.02em]">
            Pip is marking your session…
          </h1>
          <p className="m-0 max-w-[44ch] text-muted">
            An independent grader is reading what you said against the Board&apos;s criteria. This takes a moment.
          </p>
        </>
      )}
    </div>
  );
}

export function SessionHeader({
  c,
  phase,
  remaining,
  elapsed,
  notice,
}: {
  c: PublicCase;
  phase: Phase;
  remaining: number;
  elapsed: number;
  notice: string | null;
}) {
  return (
    <header className="border-b border-line-soft bg-white">
      <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <Link href="/home" aria-label="Back to case map" className="grid size-11 place-items-center rounded-xl">
            <LogoMark size={38} />
          </Link>
          <div className="flex flex-col leading-[1.25]">
            <span className="text-lg font-semibold tracking-[-0.02em]">
              {phase === "review" ? c.title : `${CATEGORY_LABEL[c.category]} case`}
            </span>
            <span className="text-[13px] text-subtle">{c.setting}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {notice && phase === "live" && (
            <span
              role="status"
              className="rounded-full bg-sun-tint px-3.5 py-1.5 text-[13px] font-semibold text-sun-deep"
            >
              Examiner: {notice}
            </span>
          )}
          <span className="inline-flex items-center gap-2.5 rounded-full bg-ink py-1 pr-3.5 pl-1.5 text-[13px] font-semibold text-white">
            <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-white">
              <Pip mood={phase === "review" ? "happy" : "exam"} size={30} />
            </span>
            {phase === "review" ? "Review mode · Pip's back" : "Exam mode · Pip's locked in"}
          </span>
          {phase !== "review" && (
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="block h-1 w-[120px] rounded-sm bg-line-soft">
                <span
                  className="block h-1 rounded-sm bg-pink"
                  style={{ width: `${(elapsed / c.partSeconds) * 100}%` }}
                />
              </span>
              <span role="timer" aria-label="Time remaining" className="font-mono text-xl font-medium">
                {clock(remaining)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
