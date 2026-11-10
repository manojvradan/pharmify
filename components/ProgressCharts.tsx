import type { Progress } from "@/lib/session/progress";

/**
 * The progress charts: a week of interviews, recent results, hidden facts, and skills.
 * Shown in full on the history page (/debrief); the dashboard keeps a one-line summary.
 */

const tile = "flex flex-col gap-0.5 rounded-[18px] border border-line bg-white px-[18px] py-3.5";

export function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

/*
 * Chart colours for the progress section, checked with the dataviz palette validator:
 * one accent for the data that matters, a grey for context, and a pale track for "empty".
 * The accent and grey both clear 3:1 against white and stay apart under colour blindness.
 */
const ACCENT = "#8A1F55";
const CONTEXT = "#8E879C";
const TRACK = "#EEEBF3";

const label = "text-[13px] font-semibold text-muted";
const big = "text-[28px] leading-[1.1] font-bold tracking-[-0.02em]";

/** A single ratio against its whole. */
export function Meter({ part, whole }: { part: number; whole: number }) {
  return (
    <span aria-hidden="true" className="mt-2 block h-2 overflow-hidden rounded-full" style={{ background: TRACK }}>
      <span className="block h-full rounded-full" style={{ width: `${pct(part, whole)}%`, background: ACCENT, minWidth: part ? 4 : 0 }} />
    </span>
  );
}

/** Interviews per day for the last week, as small columns; the busiest day is labelled. */
function WeekColumns({ days }: { days: { day: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
  return (
    <div
      role="img"
      aria-label={`Interviews per day, last 7 days: ${days.map((d) => `${d.label} ${d.count}`).join(", ")}`}
      className="mt-2 flex items-end gap-1.5"
    >
      {days.map((d, i) => (
        <div key={d.day} className="group relative flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.count} interview${d.count === 1 ? "" : "s"}`}>
          <span className="h-4 text-[11px] leading-4 font-semibold text-muted tabular-nums">
            {d === busiest && d.count > 0 ? d.count : ""}
          </span>
          <span className="flex h-11 w-full max-w-[18px] items-end">
            <span
              className="block w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{ height: d.count ? `${Math.max(12, (d.count / max) * 100)}%` : 2, background: d.count ? ACCENT : TRACK }}
            />
          </span>
          <span className={`text-[11px] leading-none ${i === days.length - 1 ? "font-bold text-ink" : "text-subtle"}`}>
            {i === days.length - 1 ? "Today" : d.label.slice(0, 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The last results in order, oldest on the left: filled squares passed. */
function ResultStrip({ recent }: { recent: { pass: boolean; title: string }[] }) {
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      <div role="img" aria-label={`Last ${recent.length} results, oldest first: ${recent.map((r) => (r.pass ? "passed" : "not yet")).join(", ")}`} className="flex flex-wrap gap-1">
        {recent.map((r, i) => (
          <span
            key={i}
            title={`${r.title}: ${r.pass ? "passed" : "not yet"}`}
            className="grid size-4 place-items-center rounded-[4px] border-2"
            style={r.pass ? { background: ACCENT, borderColor: ACCENT } : { background: "#FFFFFF", borderColor: CONTEXT }}
          >
            {r.pass && (
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        ))}
      </div>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-subtle">
        <span className="basis-full">Last {recent.length}, oldest first</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-[3px]" style={{ background: ACCENT }} />Passed</span>
        <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-[3px] border-2" style={{ borderColor: CONTEXT }} />Not yet</span>
      </span>
    </div>
  );
}

/**
 * How often each skill was solid ("yes") across the graded interviews, weakest first. The
 * skill to work on next is in the accent colour; the rest are grey context.
 */
function SkillBars({ skills, focus, done }: { skills: { skill: string; yes: number; partly: number; no: number }[]; focus: string | null; done: number }) {
  const rows = skills
    .map((s) => ({ ...s, total: s.yes + s.partly + s.no }))
    .sort((a, b) => (a.total ? a.yes / a.total : 2) - (b.total ? b.yes / b.total : 2) || a.skill.localeCompare(b.skill));
  return (
    <div className={`${tile} col-span-full gap-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[15px] font-bold">Skills</span>
        <span className="text-[13px] text-muted">How often each was solid across your {done} interview{done === 1 ? "" : "s"}</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {rows.map((r) => {
          const isFocus = r.skill === focus;
          return (
            <li key={r.skill} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 max-sm:grid-cols-[1fr_auto]">
              <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm ${isFocus ? "font-bold" : "font-medium text-ink-2"}`}>
                {r.skill}
                {isFocus && (
                  <span className="rounded-full bg-sun-tint px-2 py-px text-[11px] font-bold text-sun-deep">Work on next</span>
                )}
              </span>
              <span
                aria-hidden="true"
                title={r.total ? `${r.skill}: solid ${r.yes}, partly ${r.partly}, not yet ${r.no}` : `${r.skill}: not marked yet`}
                className="block h-2.5 overflow-hidden rounded-full max-sm:order-last max-sm:col-span-2"
                style={{ background: TRACK }}
              >
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${pct(r.yes, r.total)}%`, minWidth: r.yes ? 4 : 0, background: isFocus ? ACCENT : CONTEXT }}
                />
              </span>
              <span className="text-[13px] font-semibold text-muted tabular-nums">
                {r.total ? `${r.yes} of ${r.total}` : "–"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The full overview: three chart tiles and the skills chart. */
export function ProgressOverview({ p }: { p: Progress }) {
  return (
    <>
      <div className={tile}>
        <span className={label}>Interviews done</span>
        <span className={big}>{p.done}</span>
        <span className="text-[13px] text-muted">{p.doneThisWeek} this week</span>
        <WeekColumns days={p.daily} />
      </div>
      <div className={tile}>
        <span className={label}>Pass rate</span>
        <span className={big}>{pct(p.passed, p.done)}%</span>
        <span className="text-[13px] text-muted">{p.passed} of {p.done} passed</span>
        <Meter part={p.passed} whole={p.done} />
        <ResultStrip recent={p.recent} />
      </div>
      <div className={tile}>
        <span className={label}>Hidden facts found</span>
        <span className={big}>{p.factsTotal ? `${pct(p.factsFound, p.factsTotal)}%` : "–"}</span>
        <span className="text-[13px] text-muted">
          {p.factsTotal ? `${p.factsFound} of ${p.factsTotal} found` : "No hidden facts yet"}
        </span>
        {p.factsTotal > 0 && <Meter part={p.factsFound} whole={p.factsTotal} />}
        {p.mostMissed && (
          <div className="mt-2.5 flex flex-col gap-0.5 rounded-xl bg-canvas px-3 py-2">
            <span className="text-[11px] font-bold tracking-[0.04em] text-subtle uppercase">
              Most missed · {p.mostMissed.missed}×
            </span>
            <span className="line-clamp-2 text-[13px] leading-snug text-ink-2" title={p.mostMissed.fact}>
              {p.mostMissed.fact}
            </span>
          </div>
        )}
      </div>
      <SkillBars skills={p.skills} focus={p.workOn?.skill ?? null} done={p.done} />
    </>
  );
}

