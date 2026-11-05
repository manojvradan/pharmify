import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pip } from "@/components/Pip";
import { getCase } from "@/lib/cases/bank";
import { getViewerSessions } from "@/lib/session/viewer";

export const metadata: Metadata = { title: "Debriefs" };

const dateFormat = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function clock(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
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
            <span className={`flex-none rounded-full px-2.5 py-[3px] text-[13px] font-bold ${status.cls}`}>{status.label}</span>
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
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5">
        <h1 className="m-0 text-[clamp(26px,2.6vw,32px)] font-bold tracking-[-0.015em]">Your debriefs</h1>
        <Suspense fallback={<p className="m-0 text-muted">Loading your interviews…</p>}>
          <SessionList />
        </Suspense>
      </div>
    </main>
  );
}
