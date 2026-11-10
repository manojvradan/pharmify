import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pip } from "@/components/Pip";
import type { Category } from "@/lib/session/progress";
import { getViewerProgress } from "@/lib/session/viewer";

export const metadata: Metadata = { title: "Home" };

const categories: {
  key: Category;
  big: string;
  tag: string;
  bg: string;
  bar: string;
  icon: string;
}[] = [
  {
    key: "ethical",
    big: "Ethical",
    tag: "Tough calls",
    bg: "radial-gradient(circle, rgba(22,17,42,0.07) 1.6px, transparent 1.9px) 0 0 / 16px 16px, #FFE8F3",
    bar: "#FF8CC6",
    icon: "M12 3v18M7 21h10M4 7h16M6.5 7L4 13a3 3 0 005 0L6.5 7zM17.5 7L15 13a3 3 0 005 0l-2.5-6z",
  },
  {
    key: "legal",
    big: "Legal",
    tag: "Know the rules",
    bg: "repeating-linear-gradient(0deg, transparent 0 21px, rgba(22,17,42,0.06) 21px 22.5px), #FFF4D6",
    bar: "#FFC94D",
    icon: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  },
  {
    key: "clinical",
    big: "Complex clinical",
    tag: "More than one problem",
    bg: "linear-gradient(rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, linear-gradient(90deg, rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, #EFE6FF",
    bar: "#B99CF5",
    icon: "M9.5 4.5l-5 5a4.6 4.6 0 006.5 6.5l5-5a4.6 4.6 0 00-6.5-6.5zM7 7l6.5 6.5M18 15v6M15 18h6",
  },
];

const tile = "flex flex-col gap-0.5 rounded-[18px] border border-line bg-white px-[18px] py-3.5";

function pct(part: number, whole: number) {
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
function Meter({ part, whole }: { part: number; whole: number }) {
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

/** The progress tiles and skills chart, from the user's graded sessions. */
async function ProgressTiles() {
  const p = await getViewerProgress();
  if (!p || p.done === 0) {
    return (
      <div className={`${tile} col-span-full`}>
        <span className="text-[13px] font-semibold text-muted">No interviews yet</span>
        <span className="text-xl leading-[1.3] font-bold">Your progress shows up here after your first debrief.</span>
      </div>
    );
  }
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

function ProgressTilesFallback() {
  return (
    <>
      {["Interviews done", "Pass rate", "Hidden facts found"].map((name) => (
        <div key={name} className={tile} aria-busy="true">
          <span className={label}>{name}</span>
          <span className="h-[31px] w-16 animate-pulse rounded-lg bg-line-soft motion-reduce:animate-none" />
          <span className="h-4 w-24 animate-pulse rounded bg-line-soft motion-reduce:animate-none" />
          <span className="mt-2 h-14 w-full animate-pulse rounded-lg bg-line-soft motion-reduce:animate-none" />
        </div>
      ))}
      <div className={`${tile} col-span-full gap-3`} aria-busy="true">
        <span className="text-[15px] font-bold">Skills</span>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-2.5 w-full animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" />
        ))}
      </div>
    </>
  );
}

function CategoryBar({ played, passed, bar }: { played: number | null; passed: number | null; bar: string }) {
  return (
    <div className="flex flex-col gap-1.5 pt-0.5">
      <span className="flex justify-between text-sm font-bold">
        <span>{played ?? "–"} played</span>
        <span className="text-muted">{passed ?? "–"} passed</span>
      </span>
      <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-[5px] bg-line-soft">
        <span className="block h-full" style={{ width: `${pct(passed ?? 0, played ?? 0)}%`, background: bar }} />
      </span>
    </div>
  );
}

async function CategoryCounts({ category, bar }: { category: Category; bar: string }) {
  const p = await getViewerProgress();
  const c = p?.byCategory[category] ?? { played: 0, passed: 0 };
  return <CategoryBar played={c.played} passed={c.passed} bar={bar} />;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-5 px-[clamp(16px,3vw,36px)] pt-6 pb-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-[clamp(26px,2.6vw,32px)] font-bold tracking-[-0.015em]">Ready for an interview?</h1>
          <p className="m-0 text-muted">
            Clinical cases are a 20-minute role play. Ethical and legal cases: read the case, then talk for 5 minutes about what you&apos;d do.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="#FFC94D" strokeWidth="1.6" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="#FFC94D" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          [XX] days to your sitting
        </span>
      </div>

      {/* Quick play */}
      <section
        aria-label="Quick play"
        className="relative flex flex-wrap items-center gap-7 overflow-hidden rounded-[28px] bg-pink px-8 py-[22px] text-ink"
      >
        <span aria-hidden="true" className="absolute -top-[90px] -right-[60px] size-[260px] rounded-full bg-white opacity-[0.18]" />
        <span aria-hidden="true" className="absolute right-[230px] -bottom-[70px] size-[140px] rounded-full bg-white opacity-[0.14]" />
        <div className="relative size-[132px] flex-none">
          <span aria-hidden="true" className="absolute -inset-[7px] rounded-full border-2 border-dashed border-white opacity-70" />
          <div className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-white bg-[#FFE3F1]">
            <div className="absolute top-[-4px] left-[9px]">
              <Pip mood="happy" size={110} />
            </div>
          </div>
        </div>
        <div className="relative flex flex-[1_1_340px] flex-col gap-2">
          <span className="self-start rounded-full bg-ink px-3 py-[5px] font-mono text-[13px] text-white">QUICK PLAY</span>
          <h2 className="m-0 text-[clamp(30px,3.2vw,42px)] leading-none font-bold tracking-[-0.02em]">
            Surprise interview
          </h2>
          <p className="m-0 max-w-[46ch] font-semibold text-plum">Pip picks a random case from any category</p>
          <div className="flex flex-wrap gap-2">
            <Chip>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8.5" r="5.5" stroke="#16112A" strokeWidth="1.6" />
                <path d="M8 6v2.7l1.8 1.1" stroke="#16112A" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              5–20 min
            </Chip>
            <Chip>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="2.3" stroke="#16112A" strokeWidth="1.5" />
                <circle cx="11" cy="6" r="2" stroke="#16112A" strokeWidth="1.5" />
                <path
                  d="M1.5 13c.6-2.4 2.2-3.6 4-3.6s3.4 1.2 4 3.6M10 9.6c1.8 0 3.3 1 3.9 3.4"
                  stroke="#16112A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Patient + prescriber
            </Chip>
            <Chip>
              <span aria-hidden="true" className="font-bold">?</span>
              Hidden facts inside
            </Chip>
          </div>
        </div>
        <Link
          href="/session"
          className="relative inline-flex min-h-[58px] items-center justify-center gap-3 rounded-[18px] border-2 border-ink bg-sun px-[30px] text-[21px] font-bold text-ink no-underline shadow-pop-lg hover:text-ink"
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M5 3.5v11l9-5.5z" fill="#16112A" stroke="#16112A" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Start interview
        </Link>
      </section>

      {/* Progress */}
      <section aria-labelledby="prog" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="prog" className="m-0 text-2xl font-bold tracking-[-0.015em]">Your progress</h2>
          <Link href="/debrief" className="text-[15px] font-bold">See past debriefs</Link>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          <Suspense fallback={<ProgressTilesFallback />}>
            <ProgressTiles />
          </Suspense>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cats" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="cats" className="m-0 text-2xl font-bold tracking-[-0.015em]">Pick a category</h2>
          <span className="text-[15px] text-muted">Choose the type of interview.</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
          {categories.map((c) => {
            return (
              <article
                key={c.big}
                className="flex flex-col overflow-hidden rounded-3xl border-[1.5px] border-line bg-white shadow-card"
              >
                <div
                  className="relative box-border flex h-[188px] flex-col justify-between gap-3 overflow-hidden border-b-[1.5px] border-line px-5 pt-[18px] pb-5"
                  style={{ background: c.bg }}
                >
                  <div className="relative flex items-center justify-between gap-2.5">
                    <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-line bg-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d={c.icon} stroke="#16112A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold">{c.tag}</span>
                  </div>
                  <h3 className="relative m-0 flex flex-col leading-[0.95]">
                    <span className="max-w-[9ch] text-[clamp(32px,2.8vw,42px)] font-bold tracking-[-0.02em]">{c.big}</span>
                    <span className="mt-1 text-[19px] font-bold tracking-[-0.01em] text-ink-2">cases</span>
                  </h3>
                </div>
                <div className="flex flex-1 flex-col gap-3.5 px-5 pt-4 pb-5">
                  <Suspense fallback={<CategoryBar played={null} passed={null} bar={c.bar} />}>
                    <CategoryCounts category={c.key} bar={c.bar} />
                  </Suspense>
                  <Link
                    href={`/session?category=${c.key}`}
                    className="mt-auto inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-ink bg-white text-base font-semibold text-ink no-underline hover:text-ink"
                  >
                    Start
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Flashcards promo */}
      <section
        aria-label="Code of Ethics flashcards"
        className="flex flex-wrap items-center gap-5 rounded-3xl bg-ink px-6 py-3.5 text-white"
      >
        <Pip mood="thinking" size={54} />
        <div className="flex flex-[1_1_300px] flex-col gap-1">
          <span className="text-[13px] font-bold tracking-[0.06em] text-sun uppercase">Study tool</span>
          <h2 className="m-0 text-[21px] font-bold tracking-[-0.02em]">Code of Ethics flashcards</h2>
          <p className="m-0 text-on-ink-muted">A separate way to learn the Code of Ethics, a few cards a day.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex flex-col items-end leading-[1.2]">
            <span className="text-[28px] font-bold">12</span>
            <span className="text-[13px] text-on-ink-muted">due today</span>
          </span>
          <Link
            href="/flashcards"
            className="inline-flex min-h-[52px] items-center rounded-2xl border-2 border-white bg-pink px-6 font-semibold text-ink no-underline shadow-pop-white hover:text-ink"
          >
            Review cards
          </Link>
        </div>
      </section>
    </main>
  );
}
