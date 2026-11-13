import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GetFeedbackButton } from "@/components/GetFeedbackButton";
import { Pip } from "@/components/Pip";
import { getCase } from "@/lib/cases/bank";
import { ProgressOverview } from "@/components/ProgressCharts";
import { getViewerProgress, getViewerSessions } from "@/lib/session/viewer";

export const metadata: Metadata = { title: "History" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function clock(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const stat = "flex flex-col gap-0.5 rounded-[18px] border border-line bg-white px-[18px] py-3.5";

/**
 * Statistics: a summary row as soon as there's any interview, then the charts (a week of
 * interviews, recent results, hidden facts, skills) once at least one has been marked.
 */
async function Overview() {
  const [sessions, p] = await Promise.all([getViewerSessions(), getViewerProgress()]);
  if (!sessions || sessions.length === 0) return null;
  const marked = sessions.filter((s) => s.debrief);
  const passed = marked.filter((s) => s.debrief?.report.result === "pass").length;
  const times = marked.map((s) => s.timeUsed).filter((t): t is number => t != null);
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const summary = [
    { label: "Interviews started", value: String(sessions.length) },
    { label: "Marked", value: String(marked.length), note: marked.length < sessions.length ? `${sessions.length - marked.length} not finished` : undefined },
    { label: "Passed", value: String(passed), note: marked.length ? `of ${marked.length} marked` : undefined },
    { label: "Average time used", value: avg == null ? "–" : clock(avg) },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className={stat}>
            <span className="text-[13px] font-semibold text-muted">{s.label}</span>
            <span className="text-[28px] leading-[1.1] font-bold tracking-[-0.02em] tabular-nums">{s.value}</span>
            {s.note && <span className="text-[13px] text-muted">{s.note}</span>}
          </div>
        ))}
      </div>
      {p && p.done > 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <ProgressOverview p={p} />
        </div>
      )}
    </>
  );
}

async function SessionList() {
  const sessions = (await getViewerSessions()) ?? [];
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border-[1.5px] border-line bg-white px-6 py-12 text-center">
        <Pip mood="happy" size={90} />
        <p className="m-0 text-xl font-bold">No debriefs yet</p>
        <p className="m-0 max-w-[40ch] text-muted">Finish an interview and Pip&apos;s marking shows up here.</p>
        <Link
          href="/session"
          className="inline-flex min-h-12 items-center rounded-[14px] border-2 border-ink bg-sun px-6 font-bold text-ink no-underline shadow-pop hover:text-ink"
        >
          Start an interview
        </Link>
      </div>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {sessions.map((s) => {
        const c = getCase(s.caseId);
        const r = s.debrief?.report;
        const status = r
          ? r.result === "pass"
            ? { label: "Passed", cls: "bg-ok-tint text-ok" }
            : { label: "Not yet", cls: "bg-alert-tint text-alert" }
          : s.status === "live"
            ? { label: "Not finished", cls: "bg-chip text-muted" }
            : { label: "Not marked", cls: "bg-chip text-muted" };
        const body = (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-bold">{c?.problemType ?? s.caseId}</span>
              <span className="truncate text-sm text-muted">
                {dateFormat.format(s.startedAt)}
                {s.timeUsed != null && ` · ${clock(s.timeUsed)} used`}
                {r && ` · ${r.headline}`}
              </span>
            </span>
            {!s.debrief && s.said > 0 ? (
              <GetFeedbackButton sessionId={s.id} />
            ) : (
              <span className={`flex-none rounded-full px-2.5 py-[3px] text-[13px] font-bold ${status.cls}`}>
                {!s.debrief && s.said === 0 ? "Nothing said" : status.label}
              </span>
            )}
          </>
        );
        return (
          <li key={s.id}>
            {s.debrief ? (
              <Link
                href={`/debrief/${s.id}`}
                className="flex min-h-16 items-center gap-4 rounded-2xl border-[1.5px] border-line bg-white px-5 py-3 text-ink no-underline hover:border-ink hover:text-ink"
              >
                {body}
              </Link>
            ) : (
              <div className="flex min-h-16 items-center gap-4 rounded-2xl border-[1.5px] border-line-soft bg-white px-5 py-3 text-ink">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function DebriefsPage() {
  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-5 px-[clamp(16px,3vw,36px)] pt-6 pb-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
        <h1 className="m-0 text-[clamp(26px,2.6vw,32px)] font-bold tracking-[-0.015em]">Your history</h1>
        <Suspense fallback={null}>
          <Overview />
        </Suspense>
        <h2 className="m-0 mt-2 text-xl font-bold tracking-[-0.015em]">Past interviews</h2>
        <Suspense fallback={<p className="m-0 text-muted">Loading your interviews…</p>}>
          <SessionList />
        </Suspense>
      </div>
    </main>
  );
}
