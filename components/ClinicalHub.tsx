"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { MyPip } from "@/components/MyPip";
import { SpecialtyIcon } from "@/components/SpecialtyIcon";
import type { CastId } from "@/lib/cast";
import { SPECIALTIES, SPECIALTY_IDS, type SpecialtyId } from "@/lib/cases/specialties";

/** A complex clinical case as its card shows it (built on the server from the case bank). */
export type ClinicalCaseCard = {
  id: string;
  title: string;
  problemType: string;
  specialty: SpecialtyId;
  /** The question sheet; the card shows its first lines. */
  summary: string;
  /** The patient's name and age, e.g. "Mr Nguyen, 71". */
  who: string;
  avatar: CastId;
  /** The prescriber the candidate can phone, if any. */
  prescriber?: string;
};

/** Graded tries on one case, and whether any passed. */
export type ClinicalCaseProgress = { tries: number; passed: boolean };

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const lift = `transition-[transform,box-shadow] duration-[550ms] ${ease} motion-safe:hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-20px_rgba(22,17,42,0.35)]`;

/**
 * The complex clinical case hub (design reference: a clinical case hub with cases grouped by
 * specialty). Filter by specialty or search; each card starts that case. `progress` is null
 * while the candidate's results load.
 */
export function ClinicalHub({ cases, progress }: { cases: ClinicalCaseCard[]; progress: Record<string, ClinicalCaseProgress> | null }) {
  const [only, setOnly] = useState<SpecialtyId | null>(null);
  const [query, setQuery] = useState("");

  const count = useMemo(() => {
    const n = Object.fromEntries(SPECIALTY_IDS.map((id) => [id, 0])) as Record<SpecialtyId, number>;
    for (const c of cases) n[c.specialty]++;
    return n;
  }, [cases]);

  const q = query.trim().toLowerCase();
  const shown = cases.filter(
    (c) =>
      (!only || c.specialty === only) &&
      (!q || [c.title, c.problemType, c.summary, c.who, SPECIALTIES[c.specialty].label].some((t) => t.toLowerCase().includes(q))),
  );
  const tried = progress ? cases.filter((c) => progress[c.id]?.tries).length : null;
  const passed = progress ? cases.filter((c) => progress[c.id]?.passed).length : null;
  const withCases = SPECIALTY_IDS.filter((id) => count[id] > 0);
  const empty = SPECIALTY_IDS.filter((id) => count[id] === 0);

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-[clamp(16px,3vw,36px)] pt-6 pb-10">
      <Link href="/home" className="inline-flex items-center gap-1.5 self-start text-[15px] font-bold text-ink-2 no-underline hover:text-ink">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Home
      </Link>

      {/* Header: the clinical category card from the home page, opened up. */}
      <section
        aria-labelledby="hub-title"
        className="group relative flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-[28px] border-[1.5px] border-line px-[clamp(20px,3vw,32px)] py-7"
        style={{
          background:
            "linear-gradient(rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, linear-gradient(90deg, rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, #EFE6FF",
        }}
      >
        <span aria-hidden="true" className="absolute -top-16 -right-10 size-[220px] transition-transform duration-[1200ms] ease-out motion-safe:group-hover:-translate-x-8 motion-safe:group-hover:translate-y-3">
          <span className="block size-full animate-bubble-a rounded-full bg-white opacity-35" />
        </span>
        <span aria-hidden="true" className="absolute right-[34%] -bottom-10 size-[96px] transition-transform duration-[1200ms] ease-out motion-safe:group-hover:translate-x-6 motion-safe:group-hover:-translate-y-4">
          <span className="block size-full animate-bubble-b rounded-full bg-white opacity-30" />
        </span>
        <div className="relative flex max-w-[620px] flex-col gap-3">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-line bg-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9.5 4.5l-5 5a4.6 4.6 0 006.5 6.5l5-5a4.6 4.6 0 00-6.5-6.5zM7 7l6.5 6.5M18 15v6M15 18h6"
                stroke="#16112A"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 id="hub-title" className="m-0 flex flex-col leading-[0.95]">
            <span className="text-[clamp(34px,3.6vw,48px)] font-bold tracking-[-0.02em]">Complex clinical</span>
            <span className="mt-1 text-[21px] font-bold tracking-[-0.01em] text-ink-2">cases</span>
          </h1>
          <p className="m-0 max-w-[52ch] text-[15px] font-medium text-ink-2">
            20-minute role plays. Talk to the patient, phone the prescriber, and sort out the problem.
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-3">
          <Stat label="Tried" value={tried === null ? null : `${tried}/${cases.length}`} />
          <Stat label="Passed" value={passed === null ? null : String(passed)} />
          <Link
            href="/session?category=clinical"
            className={`inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-[18px] border-2 border-ink bg-sun px-6 text-lg font-bold text-ink no-underline shadow-pop transition-transform duration-[550ms] ${ease} hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M5 3.5v11l9-5.5z" fill="#16112A" stroke="#16112A" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            Surprise me
          </Link>
        </div>
      </section>

      {/* Search and specialties */}
      <div className="flex flex-col gap-3.5">
        <label className="relative block">
          <span className="sr-only">Search clinical cases</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
            <circle cx="8" cy="8" r="5.25" stroke="#625C70" strokeWidth="1.7" />
            <path d="M12 12l3.5 3.5" stroke="#625C70" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, medicines or problems"
            className="box-border min-h-[50px] w-full rounded-2xl border-[1.5px] border-line bg-white pr-4 pl-11 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Specialty" className="flex flex-wrap gap-2">
          <Chip on={only === null} onClick={() => setOnly(null)} label="All specialties" n={cases.length} />
          {SPECIALTY_IDS.map((id) => (
            <Chip key={id} on={only === id} onClick={() => setOnly(only === id ? null : id)} label={SPECIALTIES[id].label} n={count[id]} specialty={id} />
          ))}
        </div>
      </div>

      {q || only ? (
        // Searching or one specialty: one flat list.
        <section aria-live="polite" className="flex flex-col gap-4">
          {only && !q ? (
            <SectionHead id={only} n={count[only]} />
          ) : (
            <h2 className="m-0 text-xl font-bold tracking-[-0.015em]">
              {shown.length} {shown.length === 1 ? "case" : "cases"}
              {only ? ` in ${SPECIALTIES[only].label.toLowerCase()}` : ""}
            </h2>
          )}
          {shown.length ? (
            <Grid>
              {shown.map((c) => (
                <CaseCard key={c.id} c={c} p={progress?.[c.id]} loading={!progress} />
              ))}
            </Grid>
          ) : (
            <Empty
              title={only && !q ? `No ${SPECIALTIES[only].label.toLowerCase()} cases yet` : "No cases match that"}
              body={only && !q ? "They're on the way. Try another specialty, or let Pip surprise you." : "Try another word, or clear the search."}
            />
          )}
        </section>
      ) : (
        <>
          {withCases.map((id) => (
            <section key={id} aria-labelledby={`sp-${id}`} className="flex flex-col gap-4">
              <SectionHead id={id} n={count[id]} onShowOnly={() => setOnly(id)} />
              <Grid>
                {cases
                  .filter((c) => c.specialty === id)
                  .map((c) => (
                    <CaseCard key={c.id} c={c} p={progress?.[c.id]} loading={!progress} />
                  ))}
              </Grid>
            </section>
          ))}
          {empty.length > 0 && (
            <section aria-labelledby="soon" className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-dashed border-line bg-white/60 px-5 py-4">
              <h2 id="soon" className="m-0 text-[15px] font-bold text-ink-2">
                More specialties on the way
              </h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {empty.map((id) => (
                  <li key={id} className="inline-flex items-center gap-2 rounded-full bg-chip py-1 pr-3.5 pl-1 text-sm font-semibold text-subtle">
                    <span className="grid size-7 place-items-center rounded-full opacity-70" style={{ background: SPECIALTIES[id].tint }}>
                      <SpecialtyIcon id={id} size={16} />
                    </span>
                    {SPECIALTIES[id].label}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-[92px] flex-col gap-0.5 rounded-[18px] border border-line bg-white px-4 py-2.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {value === null ? (
        <span className="h-[28px] w-12 animate-pulse rounded-lg bg-line-soft motion-reduce:animate-none" aria-busy="true" />
      ) : (
        <span className="text-[24px] leading-[1.15] font-bold tracking-[-0.02em]">{value}</span>
      )}
    </div>
  );
}

function Chip({ on, onClick, label, n, specialty }: { on: boolean; onClick: () => void; label: string; n: number; specialty?: SpecialtyId }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1 text-sm font-semibold transition-colors duration-200 ${specialty ? "pr-3.5 pl-1" : "px-4"} ${
        on ? "border-ink bg-ink text-white" : `border-line bg-white hover:border-ink ${n ? "text-ink" : "text-subtle"}`
      }`}
    >
      {specialty && (
        <span className="grid size-7 place-items-center rounded-full" style={{ background: SPECIALTIES[specialty].tint }}>
          <SpecialtyIcon id={specialty} size={16} />
        </span>
      )}
      {label}
      <span className={`min-w-5 rounded-full px-1.5 text-center text-xs leading-5 ${on ? "bg-white/20" : "bg-chip"}`}>{n}</span>
    </button>
  );
}

function SectionHead({ id, n, onShowOnly }: { id: SpecialtyId; n: number; onShowOnly?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={`sp-${id}`} className="m-0 inline-flex items-center gap-3 text-[22px] font-bold tracking-[-0.015em]">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl border border-line" style={{ background: SPECIALTIES[id].tint }}>
          <SpecialtyIcon id={id} />
        </span>
        {SPECIALTIES[id].label}
        <span className="text-[17px] font-semibold text-subtle">({n})</span>
      </h2>
      {onShowOnly && (
        <button type="button" onClick={onShowOnly} className="cursor-pointer border-0 bg-transparent p-0 text-[15px] font-bold text-pink-link hover:underline">
          Show only {SPECIALTIES[id].label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">{children}</div>;
}

function CaseCard({ c, p, loading }: { c: ClinicalCaseCard; p?: ClinicalCaseProgress; loading: boolean }) {
  const sp = SPECIALTIES[c.specialty];
  const done = p?.passed ? 100 : p?.tries ? 45 : 0;
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-3xl border-[1.5px] border-line bg-white shadow-card ${lift}`}>
      <div className="flex items-center gap-4 px-5 pt-5">
        <span
          aria-hidden="true"
          className={`flex size-[68px] flex-none items-end justify-center overflow-hidden rounded-full border-[1.5px] border-line transition-transform duration-[550ms] ${ease} motion-safe:group-hover:scale-105`}
          style={{ background: sp.tint }}
        >
          <CastAvatar id={c.avatar} size={64} decorative className="-mb-0.5 block" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 text-[20px] leading-tight font-bold tracking-[-0.015em]">{c.title}</h3>
          <p className="m-0 text-sm text-muted">
            {c.who}
            {c.prescriber ? ` · can phone ${c.prescriber}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-5 pt-3.5 text-[11.5px] font-bold tracking-[0.07em] uppercase">
        <span className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1 text-ink" style={{ background: sp.tint }}>
          <SpecialtyIcon id={c.specialty} size={14} />
          {sp.label}
        </span>
        <span className="min-w-0 truncate text-subtle">{c.problemType}</span>
      </div>
      <p className="m-0 line-clamp-3 px-5 pt-3 text-[15px] leading-[1.55] text-ink-2">{c.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-3 px-5 pt-4 pb-5">
        <Status p={p} loading={loading} />
        <Link
          href={`/session/${c.id}`}
          aria-label={`${p?.tries ? "Try again" : "Start"}: ${c.title}`}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-white px-5 text-[15px] font-semibold text-ink no-underline transition-colors duration-200 hover:bg-ink hover:text-white focus-visible:bg-ink focus-visible:text-white"
        >
          {p?.tries ? "Try again" : "Start"}
        </Link>
      </div>
      <span aria-hidden="true" className="block h-1.5 bg-line-soft">
        <span className={`block h-full transition-[width] duration-700 ${ease}`} style={{ width: `${done}%`, background: sp.bar }} />
      </span>
    </article>
  );
}

function Status({ p, loading }: { p?: ClinicalCaseProgress; loading: boolean }) {
  if (loading) return <span className="h-6 w-20 animate-pulse rounded-full bg-line-soft motion-reduce:animate-none" aria-busy="true" />;
  if (p?.passed)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-tint px-3 py-1 text-[13px] font-bold text-ok">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Passed
      </span>
    );
  if (p?.tries)
    return (
      <span className="rounded-full bg-sun-tint px-3 py-1 text-[13px] font-bold text-sun-deep">
        Tried {p.tries}× · not passed yet
      </span>
    );
  return <span className="rounded-full bg-chip px-3 py-1 text-[13px] font-bold text-subtle">New</span>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-3xl border-[1.5px] border-dashed border-line bg-white px-6 py-6">
      <MyPip mood="thinking" size={64} />
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-lg font-bold">{title}</h3>
        <p className="m-0 text-[15px] text-ink-2">{body}</p>
      </div>
    </div>
  );
}
