import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { MyPip } from "@/components/MyPip";
import { pct } from "@/components/ProgressCharts";
import { getViewerProfile } from "@/lib/profile";
import type { Category } from "@/lib/session/progress";
import { getViewerProgress } from "@/lib/session/viewer";

export const metadata: Metadata = { title: "Home" };

/* Design: "Home · dashboard". Flat cards, 1px borders, soft tints. */

const categories: {
  key: Category;
  big: string;
  bg: string;
  bar: string;
  icon: string;
}[] = [
  {
    key: "ethical",
    big: "Ethical",
    bg: "radial-gradient(circle, rgba(22,17,42,0.05) 1.4px, transparent 1.9px) 0 0 / 16px 16px, #FFE8F3",
    bar: "#FF8CC6",
    icon: "M12 3v18M7 21h10M4 7h16M6.5 7L4 13a3 3 0 005 0L6.5 7zM17.5 7L15 13a3 3 0 005 0l-2.5-6z",
  },
  {
    key: "legal",
    big: "Legal",
    bg: "repeating-linear-gradient(0deg, transparent 0 21px, rgba(22,17,42,0.045) 21px 22px), #FFF4D6",
    bar: "#FFC94D",
    icon: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  },
  {
    key: "clinical",
    big: "Complex clinical",
    bg: "linear-gradient(rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, linear-gradient(90deg, rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, #EFE6FF",
    bar: "#B99CF5",
    icon: "M9.5 4.5l-5 5a4.6 4.6 0 006.5 6.5l5-5a4.6 4.6 0 00-6.5-6.5zM7 7l6.5 6.5M18 15v6M15 18h6",
  },
];

const sectionHead = "m-0 text-xl font-bold tracking-[-0.015em]";
/** Cards and tiles lift a little on hover, as before the redesign. */
const lift =
  "transition-[transform,box-shadow] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(22,17,42,0.3)]";
const link = "text-sm font-semibold text-pink-link hover:text-pink-deep";

/** "YYYY-MM" to the days until the 1st of that month (the exact date isn't asked), or null. */
function daysToSitting(
  sitting: string | null | undefined,
  now = new Date(),
): number | null {
  const m = sitting?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const start = Date.UTC(Number(m[1]), Number(m[2]) - 1, 1);
  const days = Math.ceil((start - now.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

async function SittingChip() {
  const days = daysToSitting((await getViewerProfile())?.examSitting);
  if (days === null) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="3"
          width="12"
          height="11"
          rx="2"
          stroke="#6E1F35"
          strokeWidth="1.6"
        />
        <path
          d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"
          stroke="#6E1F35"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {days === 0
        ? "Your sitting starts this month"
        : `About ${days} ${days === 1 ? "day" : "days"} to your sitting`}
    </span>
  );
}

/** One progress tile: a coloured dot, a label, and a big number in the tile's own ink. */
function Metric({
  label,
  value,
  tint,
  line,
  dot,
  ink,
}: {
  label: string;
  value: ReactNode;
  tint: string;
  line: string;
  dot: string;
  ink: string;
}) {
  return (
    <div
      className={`box-border flex min-h-[112px] flex-col justify-between gap-3.5 rounded-[14px] border px-5 pt-4 pb-[18px] ${lift}`}
      style={{ background: tint, borderColor: line }}
    >
      <span className="inline-flex items-center gap-2 text-[13px] font-medium text-muted">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ background: dot }}
        />
        {label}
      </span>
      <span
        className="text-4xl leading-none font-bold tracking-[-0.03em]"
        style={{ color: ink }}
      >
        {value}
      </span>
    </div>
  );
}

const pulse = (
  <span
    className="block h-9 w-14 animate-pulse rounded-lg bg-white/70 motion-reduce:animate-none"
    aria-busy="true"
  />
);

function Metrics({
  done,
  rate,
  facts,
  workOn,
}: {
  done: ReactNode;
  rate: ReactNode;
  facts: ReactNode;
  workOn: ReactNode;
}) {
  return (
    <section aria-labelledby="prog" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="prog" className={sectionHead}>
          Your progress
        </h2>
        <Link href="/debrief" className={link}>
          See past debriefs
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3.5">
        <Metric
          label="Cases done"
          value={done}
          tint="#FFF1F7"
          line="#F6D9E8"
          dot="#FF8CC6"
          ink="#8A1F55"
        />
        <Metric
          label="Pass rate"
          value={rate}
          tint="#F6F1FF"
          line="#E6DCFA"
          dot="#B99CF5"
          ink="#4B2A86"
        />
        <Metric
          label="Hidden facts found"
          value={facts}
          tint="#FFF8E6"
          line="#F3E3B5"
          dot="#FFC94D"
          ink="#7A4B00"
        />
        <div
          className={`box-border flex min-h-[112px] flex-col justify-between gap-3.5 rounded-[14px] border border-line bg-white px-5 pt-4 pb-[18px] ${lift}`}
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-pink-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="7" stroke="#B4236E" strokeWidth="1.8" />
              <circle cx="9" cy="9" r="3" fill="#B4236E" />
            </svg>
            Work on next
          </span>
          <span className="text-[26px] leading-none font-bold tracking-[-0.02em]">
            {workOn}
          </span>
        </div>
      </div>
    </section>
  );
}

/** The dashboard's one-row summary; the charts are on the history page. */
async function ProgressTiles() {
  const p = await getViewerProgress();
  // Nothing to show before the first debrief, so the section stays out of the way.
  if (!p || p.done === 0) return null;
  return (
    <Metrics
      done={p.done}
      rate={`${pct(p.passed, p.done)}%`}
      facts={p.factsTotal ? `${pct(p.factsFound, p.factsTotal)}%` : "–"}
      workOn={p.workOn?.skill ?? "Keep it up"}
    />
  );
}

function CategoryBar({
  played,
  passed,
  bar,
}: {
  played: number | null;
  passed: number | null;
  bar: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 pt-0.5">
      <span className="flex justify-between text-[13px] font-semibold">
        <span>{played ?? "–"} played</span>
        <span className="text-muted">{passed ?? "–"} passed</span>
      </span>
      <span
        aria-hidden="true"
        className="block h-1.5 overflow-hidden rounded-[3px] bg-line-soft"
      >
        <span
          className="block h-full"
          style={{
            width: `${pct(passed ?? 0, played ?? 0)}%`,
            background: bar,
          }}
        />
      </span>
    </div>
  );
}

async function CategoryCounts({
  category,
  bar,
}: {
  category: Category;
  bar: string;
}) {
  const p = await getViewerProgress();
  const c = p?.byCategory[category] ?? { played: 0, passed: 0 };
  return <CategoryBar played={c.played} passed={c.passed} bar={bar} />;
}

export default function HomePage() {
  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-5 px-[clamp(16px,3vw,36px)] pt-6 pb-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-[clamp(24px,2.2vw,28px)] font-bold tracking-[-0.02em]">
            Ready for a case?
          </h1>
          <p className="m-0 text-muted">
            20-minute voice role plays. No spoilers.
          </p>
        </div>
        <Suspense>
          <SittingChip />
        </Suspense>
      </div>

      {/* Quick play */}
      <section
        aria-label="Quick play"
        className="group relative flex flex-wrap items-center gap-[22px] overflow-hidden rounded-2xl bg-pink px-[26px] py-[18px] text-ink"
      >
        <svg
          aria-hidden="true"
          width="420"
          height="200"
          viewBox="0 0 420 200"
          fill="none"
          // On hover the rings and pills drift across, as the bubbles used to.
          className="pointer-events-none absolute top-1/2 -right-10 -translate-y-1/2 transition-transform duration-[1200ms] ease-out motion-safe:group-hover:-translate-x-14 motion-safe:group-hover:rotate-[-6deg]"
        >
          <circle
            cx="300"
            cy="100"
            r="70"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <circle
            cx="300"
            cy="100"
            r="110"
            stroke="#FFFFFF"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          <circle
            cx="300"
            cy="100"
            r="150"
            stroke="#FFFFFF"
            strokeOpacity="0.15"
            strokeWidth="1.5"
          />
          <g transform="translate(118 46) rotate(35)">
            <rect
              x="-6"
              y="-13"
              width="12"
              height="26"
              rx="6"
              stroke="#FFFFFF"
              strokeOpacity="0.55"
              strokeWidth="1.6"
            />
            <path
              d="M-6 0 H6"
              stroke="#FFFFFF"
              strokeOpacity="0.55"
              strokeWidth="1.6"
            />
          </g>
          <g transform="translate(176 160) rotate(-25)">
            <rect
              x="-5"
              y="-11"
              width="10"
              height="22"
              rx="5"
              stroke="#FFFFFF"
              strokeOpacity="0.45"
              strokeWidth="1.6"
            />
            <path
              d="M-5 0 H5"
              stroke="#FFFFFF"
              strokeOpacity="0.45"
              strokeWidth="1.6"
            />
          </g>
          <path
            d="M86 140 v8 M82 144 h8"
            stroke="#FFFFFF"
            strokeOpacity="0.6"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <div className="relative size-[84px] flex-none">
          <span
            aria-hidden="true"
            className="absolute -inset-[5px] rounded-full border-2 border-dashed border-white opacity-0 transition-opacity duration-300 group-hover:animate-ring-spin group-hover:opacity-80"
          />
          <div className="absolute inset-0 overflow-hidden rounded-full bg-white">
            <div className="absolute top-[-2px] left-1.5 origin-bottom group-hover:animate-wiggle">
              <MyPip mood="happy" size={72} />
            </div>
          </div>
        </div>
        <div className="relative flex flex-[1_1_340px] flex-col gap-2">
          <span className="text-xs font-semibold tracking-[0.08em] text-brand uppercase">
            Quick play
          </span>
          <h2 className="m-0 text-[26px] leading-[1.1] font-bold tracking-[-0.02em]">
            Surprise case
          </h2>
          <p className="m-0 max-w-[46ch] text-[#4A1A33]">
            Random case, any category
          </p>
        </div>
        <Link
          href="/session"
          className="relative inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl bg-ink px-6 font-semibold text-white no-underline transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink-soft hover:text-white motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5"
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
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Start case
        </Link>
      </section>

      {/* Progress */}
      <Suspense
        fallback={
          <Metrics done={pulse} rate={pulse} facts={pulse} workOn={pulse} />
        }
      >
        <ProgressTiles />
      </Suspense>

      {/* Categories */}
      <section aria-labelledby="cats" className="flex flex-col gap-3">
        <h2 id="cats" className={sectionHead}>
          Pick a category
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
          {categories.map((c) => (
            <article
              key={c.key}
              className={`group flex flex-col overflow-hidden rounded-2xl border border-line bg-white ${lift}`}
            >
              <div
                className="relative box-border flex h-[150px] flex-col justify-between gap-3 overflow-hidden border-b border-line px-[18px] pt-4 pb-[18px]"
                style={{ background: c.bg }}
              >
                <span
                  aria-hidden="true"
                  className="grid size-[38px] place-items-center rounded-[10px] border border-line bg-white transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:-rotate-8 motion-safe:group-hover:scale-110"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d={c.icon}
                      stroke="#16112A"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="m-0 flex flex-col leading-[0.95]">
                  <span className="text-[clamp(26px,2.2vw,32px)] font-bold tracking-[-0.02em]">
                    {c.big}
                  </span>
                  <span className="mt-1 text-base font-semibold tracking-[-0.01em] text-ink-2">
                    cases
                  </span>
                </h3>
              </div>
              <div className="flex flex-1 flex-col gap-3.5 px-5 pt-4 pb-5">
                <Suspense
                  fallback={
                    <CategoryBar played={null} passed={null} bar={c.bar} />
                  }
                >
                  <CategoryCounts category={c.key} bar={c.bar} />
                </Suspense>
                <Link
                  // Each category opens its case hub (/clinical, /ethical, /legal).
                  href={`/${c.key}`}
                  className="mt-auto inline-flex min-h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#CFC9D9] bg-white text-[15px] font-semibold text-ink no-underline transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-white focus-visible:border-ink focus-visible:bg-ink focus-visible:text-white"
                >
                  Browse cases
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Flashcards promo */}
      <section
        aria-label="Code of Ethics flashcards"
        className="group flex flex-wrap items-center gap-5 rounded-2xl border border-[#E6DCFA] bg-[linear-gradient(90deg,#F6F1FF,#FFF1F7)] px-[22px] py-3.5 text-ink"
      >
        <span className="relative size-[60px] flex-none overflow-hidden rounded-full bg-white">
          <span className="absolute top-0.5 left-1.5 origin-bottom group-hover:animate-wiggle">
            <MyPip mood="thinking" size={48} />
          </span>
        </span>
        <div className="flex flex-[1_1_300px] flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.08em] text-pink-link uppercase">
            Study tool
          </span>
          <h2 className="m-0 text-lg font-semibold tracking-[-0.01em]">
            Code of Ethics flashcards
          </h2>
        </div>
        <Link
          href="/flashcards"
          className="inline-flex min-h-11 items-center rounded-[10px] bg-pink px-5 text-[15px] font-semibold text-ink no-underline hover:bg-[#FF7DBE] hover:text-ink"
        >
          Review cards
        </Link>
      </section>
    </main>
  );
}
