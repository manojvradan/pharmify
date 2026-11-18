"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { MyPip } from "@/components/MyPip";
import { SpecialtyIcon } from "@/components/SpecialtyIcon";
import type { CastId } from "@/lib/cast";
import {
  SPECIALTIES,
  SPECIALTY_IDS,
  type SpecialtyId,
} from "@/lib/cases/specialties";

/** A complex clinical case as its card shows it (built on the server from the case bank). */
export type ClinicalCaseCard = {
  id: string;
  title: string;
  specialty: SpecialtyId;
  /** The question sheet; the card shows its first lines. */
  summary: string;
  /** The patient's name and age, e.g. "Mr Nguyen, 71". */
  who: string;
  avatar: CastId;
  /** Where it happens, e.g. "Community pharmacy, NSW". */
  setting: string;
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
export function ClinicalHub({
  cases,
  progress,
  initialSpecialty,
}: {
  /** From ?specialty= in the address, so a link or a refresh opens on that specialty. */
  initialSpecialty?: SpecialtyId | null;
  cases: ClinicalCaseCard[];
  progress: Record<string, ClinicalCaseProgress> | null;
}) {
  const [only, setOnlyState] = useState<SpecialtyId | null>(
    initialSpecialty ?? null,
  );
  /** Filters to one specialty (or all), and keeps it in the address so a refresh or a link keeps it. */
  const setOnly = (id: SpecialtyId | null) => {
    setOnlyState(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("specialty", id);
    else url.searchParams.delete("specialty");
    window.history.replaceState(null, "", url);
  };
  const filtersRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  /** The case open in the details modal, and the card it opened from (for the transition). */
  const [open, setOpen] = useState<{
    c: ClinicalCaseCard;
    from: DOMRect;
  } | null>(null);
  const openCase = (c: ClinicalCaseCard, card: HTMLElement) =>
    setOpen({ c, from: card.getBoundingClientRect() });

  const count = useMemo(() => {
    const n = Object.fromEntries(SPECIALTY_IDS.map((id) => [id, 0])) as Record<
      SpecialtyId,
      number
    >;
    for (const c of cases) n[c.specialty]++;
    return n;
  }, [cases]);

  const q = query.trim().toLowerCase();
  const shown = cases.filter(
    (c) =>
      (!only || c.specialty === only) &&
      (!q ||
        [c.title, c.summary, c.who, SPECIALTIES[c.specialty].label].some((t) =>
          t.toLowerCase().includes(q),
        )),
  );
  const tried = progress
    ? cases.filter((c) => progress[c.id]?.tries).length
    : null;
  const passed = progress
    ? cases.filter((c) => progress[c.id]?.passed).length
    : null;
  const withCases = SPECIALTY_IDS.filter((id) => count[id] > 0);
  const empty = SPECIALTY_IDS.filter((id) => count[id] === 0);

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-[clamp(16px,3vw,36px)] pt-6 pb-10">
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 self-start text-[15px] font-bold text-ink-2 no-underline hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 3.5L5.5 8l4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
        <span
          aria-hidden="true"
          className="absolute -top-16 -right-10 size-[220px] transition-transform duration-[1200ms] ease-out motion-safe:group-hover:-translate-x-8 motion-safe:group-hover:translate-y-3"
        >
          <span className="block size-full animate-bubble-a rounded-full bg-white opacity-35" />
        </span>
        <span
          aria-hidden="true"
          className="absolute right-[34%] -bottom-10 size-[96px] transition-transform duration-[1200ms] ease-out motion-safe:group-hover:translate-x-6 motion-safe:group-hover:-translate-y-4"
        >
          <span className="block size-full animate-bubble-b rounded-full bg-white opacity-30" />
        </span>
        <div className="relative flex max-w-[620px] flex-col gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-xl border border-line bg-white"
          >
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
            <span className="text-[clamp(34px,3.6vw,48px)] font-bold tracking-[-0.02em]">
              Complex clinical
            </span>
            <span className="mt-1 text-[21px] font-bold tracking-[-0.01em] text-ink-2">
              cases
            </span>
          </h1>
          <p className="m-0 max-w-[52ch] text-[15px] font-medium text-ink-2">
            20-minute role plays. Talk to the patient, phone the prescriber, and
            sort out the problem.
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-3">
          <Stat
            label="Tried"
            value={tried === null ? null : `${tried}/${cases.length}`}
          />
          <Stat
            label="Passed"
            value={passed === null ? null : String(passed)}
          />
          <Link
            href="/session?category=clinical"
            className={`inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-[18px] border-2 border-ink bg-sun px-6 text-lg font-bold text-ink no-underline shadow-pop transition-transform duration-[550ms] ${ease} hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 3.5v11l9-5.5z"
                fill="#16112A"
                stroke="#16112A"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            Surprise me
          </Link>
        </div>
      </section>

      {/* Search and specialties */}
      <div ref={filtersRef} className="flex scroll-mt-6 flex-col gap-3.5">
        <label className="relative block">
          <span className="sr-only">Search clinical cases</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
          >
            <circle cx="8" cy="8" r="5.25" stroke="#625C70" strokeWidth="1.7" />
            <path
              d="M12 12l3.5 3.5"
              stroke="#625C70"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, medicines or problems"
            className="box-border min-h-[50px] w-full rounded-2xl border-[1.5px] border-line bg-white pr-4 pl-11 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none"
          />
        </label>
        <div
          role="group"
          aria-label="Specialty"
          className="flex flex-wrap gap-2"
        >
          <Chip
            on={only === null}
            onClick={() => setOnly(null)}
            label="All specialties"
            n={cases.length}
          />
          {SPECIALTY_IDS.map((id) => (
            <Chip
              key={id}
              on={only === id}
              onClick={() => setOnly(only === id ? null : id)}
              label={SPECIALTIES[id].label}
              n={count[id]}
              specialty={id}
            />
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
                <CaseCard
                  key={c.id}
                  c={c}
                  p={progress?.[c.id]}
                  loading={!progress}
                  onOpen={openCase}
                />
              ))}
            </Grid>
          ) : (
            <Empty
              title={
                only && !q
                  ? `No ${SPECIALTIES[only].label.toLowerCase()} cases yet`
                  : "No cases match that"
              }
              body={
                only && !q
                  ? "They're on the way. Try another specialty, or let Pip surprise you."
                  : "Try another word, or clear the search."
              }
            />
          )}
        </section>
      ) : (
        <>
          {withCases.map((id) => (
            <section
              key={id}
              aria-labelledby={`sp-${id}`}
              className="flex flex-col gap-4"
            >
              <SectionHead
                id={id}
                n={count[id]}
                onShowOnly={() => setOnly(id)}
              />
              <Grid>
                {cases
                  .filter((c) => c.specialty === id)
                  .map((c) => (
                    <CaseCard
                      key={c.id}
                      c={c}
                      p={progress?.[c.id]}
                      loading={!progress}
                      onOpen={openCase}
                    />
                  ))}
              </Grid>
            </section>
          ))}
          {empty.length > 0 && (
            <section
              aria-labelledby="soon"
              className="flex flex-col gap-3 rounded-3xl border-[1.5px] border-dashed border-line bg-white/60 px-5 py-4"
            >
              <h2 id="soon" className="m-0 text-[15px] font-bold text-ink-2">
                More specialties on the way
              </h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {empty.map((id) => (
                  <li
                    key={id}
                    className="inline-flex items-center gap-2 rounded-full bg-chip py-1 pr-3.5 pl-1 text-sm font-semibold text-subtle"
                  >
                    <span
                      className="grid size-7 place-items-center rounded-full opacity-70"
                      style={{ background: SPECIALTIES[id].tint }}
                    >
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
      {open && (
        <CaseModal
          key={open.c.id}
          c={open.c}
          from={open.from}
          p={progress?.[open.c.id]}
          onClosed={() => setOpen(null)}
          onPickSpecialty={(id) => {
            setQuery("");
            setOnly(id);
            filtersRef.current?.scrollIntoView({
              behavior: reduceMotion() ? "auto" : "smooth",
              block: "start",
            });
          }}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-[92px] flex-col gap-0.5 rounded-[18px] border border-line bg-white px-4 py-2.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      {value === null ? (
        <span
          className="h-[28px] w-12 animate-pulse rounded-lg bg-line-soft motion-reduce:animate-none"
          aria-busy="true"
        />
      ) : (
        <span className="text-[24px] leading-[1.15] font-bold tracking-[-0.02em]">
          {value}
        </span>
      )}
    </div>
  );
}

function Chip({
  on,
  onClick,
  label,
  n,
  specialty,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  n: number;
  specialty?: SpecialtyId;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1 text-sm font-semibold transition-colors duration-200 ${specialty ? "pr-3.5 pl-1" : "px-4"} ${
        on
          ? "border-ink bg-ink text-white"
          : `border-line bg-white hover:border-ink ${n ? "text-ink" : "text-subtle"}`
      }`}
    >
      {specialty && (
        <span
          className="grid size-7 place-items-center rounded-full"
          style={{ background: SPECIALTIES[specialty].tint }}
        >
          <SpecialtyIcon id={specialty} size={16} />
        </span>
      )}
      {label}
      <span
        className={`min-w-5 rounded-full px-1.5 text-center text-xs leading-5 ${on ? "bg-white/20" : "bg-chip"}`}
      >
        {n}
      </span>
    </button>
  );
}

function SectionHead({
  id,
  n,
  onShowOnly,
}: {
  id: SpecialtyId;
  n: number;
  onShowOnly?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2
        id={`sp-${id}`}
        className="m-0 inline-flex items-center gap-3 text-[22px] font-bold tracking-[-0.015em]"
      >
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl border border-line"
          style={{ background: SPECIALTIES[id].tint }}
        >
          <SpecialtyIcon id={id} />
        </span>
        {SPECIALTIES[id].label}
        <span className="text-[17px] font-semibold text-subtle">({n})</span>
      </h2>
      {onShowOnly && (
        <button
          type="button"
          onClick={onShowOnly}
          className="cursor-pointer border-0 bg-transparent p-0 text-[15px] font-bold text-pink-link hover:underline"
        >
          Show only {SPECIALTIES[id].label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">
      {children}
    </div>
  );
}

function CaseCard({
  c,
  p,
  loading,
  onOpen,
}: {
  c: ClinicalCaseCard;
  p?: ClinicalCaseProgress;
  loading: boolean;
  onOpen: (c: ClinicalCaseCard, card: HTMLElement) => void;
}) {
  const sp = SPECIALTIES[c.specialty];
  const done = p?.passed ? 100 : p?.tries ? 45 : 0;
  return (
    <article
      data-case={c.id}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border-[1.5px] border-line bg-white shadow-card ${lift}`}
    >
      <div className="flex items-center gap-4 px-5 pt-5">
        <span
          aria-hidden="true"
          className={`flex size-[68px] flex-none items-end justify-center overflow-hidden rounded-full border-[1.5px] border-line transition-transform duration-[550ms] ${ease} motion-safe:group-hover:scale-105`}
          style={{ background: sp.tint }}
        >
          <CastAvatar
            id={c.avatar}
            size={64}
            decorative
            className="-mb-0.5 block"
          />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 text-[20px] leading-tight font-bold tracking-[-0.015em]">
            {/* Stretched over the whole card: anywhere but Start opens the details. */}
            <button
              type="button"
              onClick={(e) => onOpen(c, e.currentTarget.closest("article")!)}
              aria-haspopup="dialog"
              className="cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-inherit after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-[3px] focus-visible:after:outline-offset-2 focus-visible:after:outline-pink"
            >
              {c.title}
            </button>
          </h3>
          <p className="m-0 text-sm text-muted">{c.who}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-5 pt-3.5 text-[11.5px] font-bold tracking-[0.07em] uppercase">
        <span
          className="inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1 text-ink"
          style={{ background: sp.tint }}
        >
          <SpecialtyIcon id={c.specialty} size={14} />
          {sp.label}
        </span>
      </div>
      <p className="m-0 line-clamp-3 px-5 pt-3 text-[15px] leading-[1.55] text-ink-2">
        {c.summary}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 px-5 pt-4 pb-5">
        <Status p={p} loading={loading} />
        <Link
          href={`/session/${c.id}`}
          aria-label={`${p?.tries ? "Try again" : "Start"}: ${c.title}`}
          className="relative z-[1] inline-flex min-h-11 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-white px-5 text-[15px] font-semibold text-ink no-underline transition-colors duration-200 hover:bg-ink hover:text-white focus-visible:bg-ink focus-visible:text-white"
        >
          {p?.tries ? "Try again" : "Start"}
        </Link>
      </div>
      <span aria-hidden="true" className="block h-1.5 bg-line-soft">
        <span
          className={`block h-full transition-[width] duration-700 ${ease}`}
          style={{ width: `${done}%`, background: sp.bar }}
        />
      </span>
    </article>
  );
}

function Status({
  p,
  loading,
}: {
  p?: ClinicalCaseProgress;
  loading: boolean;
}) {
  if (loading)
    return (
      <span
        className="h-6 w-20 animate-pulse rounded-full bg-line-soft motion-reduce:animate-none"
        aria-busy="true"
      />
    );
  if (p?.passed)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-tint px-3 py-1 text-[13px] font-bold text-ok">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 6.2l2.3 2.3 4.7-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
  return (
    <span className="rounded-full bg-chip px-3 py-1 text-[13px] font-bold text-subtle">
      New
    </span>
  );
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

/** A small seeded random generator, so each case's backdrop shape is its own but never changes. */
function seeded(id: string) {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * A soft abstract blob: a ring of points pushed in and out at random (seeded, so each case keeps
 * its own shape), joined by a smooth closed curve (Catmull-Rom as cubic Béziers).
 */
function blobPath(
  id: string,
  cx: number,
  cy: number,
  r: number,
  points = 7,
  wobble = 0.28,
) {
  const rnd = seeded(id);
  const turn = rnd() * Math.PI * 2;
  const pts = Array.from({ length: points }, (_, i) => {
    const a = turn + (i / points) * Math.PI * 2;
    const k = 1 - wobble / 2 + rnd() * wobble;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
  });
  const at = (i: number) => pts[(i + points) % points];
  let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A case's full details, opened from its card: it grows out of the card into place, with the patient's character in the middle, on a soft abstract shape in
 * the specialty's colours that fades into the white panel. Esc, the close button or a click outside closes it.
 */
function CaseModal({
  c,
  from,
  p,
  onClosed,
  onPickSpecialty,
}: {
  c: ClinicalCaseCard;
  from: DOMRect;
  p?: ClinicalCaseProgress;
  onClosed: () => void;
  /** The specialty pill was clicked: show every case in that specialty. */
  onPickSpecialty: (id: SpecialtyId) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const sp = SPECIALTIES[c.specialty];

  /** The transform that puts the panel exactly over a card's box. */
  const over = (box: DOMRect) => {
    const to = panel.current!.getBoundingClientRect();
    return `translate(${box.left - to.left}px, ${box.top - to.top}px) scale(${box.width / to.width}, ${box.height / to.height})`;
  };
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  useLayoutEffect(() => {
    dialog.current!.showModal();
    if (reduceMotion()) return;
    panel.current!.animate(
      [
        { transform: over(from), borderRadius: "40px", opacity: 0.6 },
        { transform: "none", borderRadius: "32px", opacity: 1 },
      ],
      {
        duration: 480,
        easing: ease,
      },
    );
    content.current!.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 320,
        delay: 200,
        easing: "ease-out",
        fill: "backwards",
      },
    );
    try {
      dialog.current!.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 360,
        pseudoElement: "::backdrop",
      });
    } catch {}
    // `from` is the card's box when it was clicked; this runs once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closes at once: shrinking back into the card looked wonky, so only the opening animates.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    dialog.current?.close();
    onClosed();
  };

  // Two layered blobs: a wide soft one in the tint, and a smaller one in the accent, off-centre.
  const back = blobPath(c.id, 160, 162, 124, 6, 0.5);
  const front = blobPath(`${c.id}:front`, 188, 128, 70, 5, 0.55);
  const fade = `fade-${c.id}`;

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`case-${c.id}`}
      onCancel={(e) => {
        e.preventDefault();
        void close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) void close();
      }}
      className="m-auto max-h-[min(720px,calc(100dvh-32px))] w-[min(880px,calc(100%-32px))] overflow-visible border-0 bg-transparent p-0 text-ink backdrop:bg-ink/55 backdrop:backdrop-blur-[3px]"
    >
      <div
        ref={panel}
        className="grid max-h-[min(720px,calc(100dvh-32px))] origin-top-left overflow-hidden rounded-[32px] bg-white shadow-[0_40px_90px_-30px_rgba(22,17,42,0.55)] md:grid-cols-[320px_1fr]"
      >
        {/* The character in the middle, on an abstract shape that melts into the white */}
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-white py-6 md:min-h-0">
          <div className="relative grid aspect-square w-[min(320px,90%)] place-items-center">
            <svg
              viewBox="0 0 320 320"
              aria-hidden="true"
              className="absolute inset-[-14%] size-[128%] overflow-visible"
            >
              <defs>
                <filter
                  id={`${fade}-soft`}
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
                <radialGradient id={`${fade}-back`} cx="50%" cy="48%" r="55%">
                  <stop offset="0%" stopColor={sp.tint} stopOpacity="1" />
                  <stop offset="70%" stopColor={sp.tint} stopOpacity="1" />
                  <stop offset="100%" stopColor={sp.tint} stopOpacity="0.35" />
                </radialGradient>
                <radialGradient id={`${fade}-front`} cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor={sp.bar} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={sp.bar} stopOpacity="0.12" />
                </radialGradient>
              </defs>
              <path
                d={back}
                fill={`url(#${fade}-back)`}
                filter={`url(#${fade}-soft)`}
              />
              <path
                d={front}
                fill={`url(#${fade}-front)`}
                filter={`url(#${fade}-soft)`}
              />
            </svg>
            {/* The bust fades out at the bottom, so there's no hard edge where the drawing stops. */}
            <CastAvatar
              id={c.avatar}
              size={300}
              decorative
              className="relative block h-auto w-[96%] animate-scene-in [mask-image:linear-gradient(to_bottom,#000_70%,transparent_97%)]"
            />
          </div>
        </div>

        {/* The full details */}
        <div
          ref={content}
          className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-[clamp(20px,3vw,32px)] pt-7 pb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold tracking-[0.07em] uppercase">
              <button
                type="button"
                onClick={() => {
                  close();
                  onPickSpecialty(c.specialty);
                }}
                title={`See all ${sp.label.toLowerCase()} cases`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 py-0.5 pr-2.5 pl-1 font-[inherit] tracking-[inherit] text-ink uppercase transition-[filter,transform] duration-200 hover:brightness-95 motion-safe:hover:-translate-y-px"
                style={{ background: sp.tint }}
              >
                <SpecialtyIcon id={c.specialty} size={14} />
                {sp.label}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 2l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <Status p={p} loading={false} />
            </div>
            <button
              type="button"
              onClick={() => void close()}
              aria-label="Close"
              className="grid size-10 flex-none cursor-pointer place-items-center rounded-full border border-line bg-white text-ink-2 hover:border-ink hover:text-ink"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <h2
              id={`case-${c.id}`}
              className="m-0 text-[clamp(26px,3vw,34px)] leading-[1.05] font-bold tracking-[-0.02em]"
            >
              {c.title}
            </h2>
            <p className="m-0 text-[15px] text-muted">
              {c.who} · {c.setting}
            </p>
          </div>
          <section
            aria-label="Question sheet"
            className="flex flex-col gap-1.5"
          >
            <span className="text-[11px] font-semibold tracking-[0.08em] text-subtle uppercase">
              Question sheet
            </span>
            <p className="m-0 text-[16px] leading-[1.65] text-pretty whitespace-pre-line text-ink-2">
              {c.summary}
            </p>
          </section>
          <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void close()}
              className="min-h-11 cursor-pointer rounded-2xl border-0 bg-transparent px-4 text-[15px] font-semibold text-ink-2 hover:text-ink"
            >
              Not now
            </button>
            <Link
              href={`/session/${c.id}`}
              className={`inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-[16px] border-2 border-ink bg-sun px-6 text-[17px] font-bold text-ink no-underline shadow-pop transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-ink motion-safe:hover:-translate-y-0.5`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 3.5v11l9-5.5z"
                  fill="#16112A"
                  stroke="#16112A"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              {p?.tries ? "Try again" : "Start case"}
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
