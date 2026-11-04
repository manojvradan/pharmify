import type { Metadata } from "next";
import Link from "next/link";
import { Pip } from "@/components/Pip";

export const metadata: Metadata = { title: "Home" };

// Mock data until sessions are stored.
const stats = [
  { label: "Interviews done", value: "7", note: "2 this week" },
  { label: "Pass rate", value: "57%", note: "4 of 7 passed" },
  { label: "Hidden facts found", value: "75%", note: "Most missed: other medicines" },
];

const categories = [
  {
    big: "Ethical",
    tag: "Tough calls",
    bg: "radial-gradient(circle, rgba(22,17,42,0.07) 1.6px, transparent 1.9px) 0 0 / 16px 16px, #FFE8F3",
    bar: "#FF8CC6",
    played: 4,
    passed: 3,
    icon: "M12 3v18M7 21h10M4 7h16M6.5 7L4 13a3 3 0 005 0L6.5 7zM17.5 7L15 13a3 3 0 005 0l-2.5-6z",
  },
  {
    big: "Legal",
    tag: "Know the rules",
    bg: "repeating-linear-gradient(0deg, transparent 0 21px, rgba(22,17,42,0.06) 21px 22.5px), #FFF4D6",
    bar: "#FFC94D",
    played: 2,
    passed: 1,
    icon: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  },
  {
    big: "Complex clinical",
    tag: "More than one problem",
    bg: "linear-gradient(rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, linear-gradient(90deg, rgba(22,17,42,0.045) 1px, transparent 1px) 0 0 / 18px 18px, #EFE6FF",
    bar: "#B99CF5",
    played: 1,
    passed: 0,
    icon: "M9.5 4.5l-5 5a4.6 4.6 0 006.5 6.5l5-5a4.6 4.6 0 00-6.5-6.5zM7 7l6.5 6.5M18 15v6M15 18h6",
  },
];

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
            Every case is a 20-minute voice interview. You won&apos;t know the problem until you&apos;re in the room.
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
              20 min
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3.5">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 rounded-[18px] border border-line bg-white px-[18px] py-3.5">
              <span className="text-[13px] font-semibold text-muted">{s.label}</span>
              <span className="text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">{s.value}</span>
              <span className="text-[13px] text-muted">{s.note}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5 rounded-[18px] bg-sun-tint px-[18px] py-3.5">
            <span className="text-[13px] font-semibold text-muted">Work on next</span>
            <span className="text-2xl leading-[1.2] font-bold tracking-[-0.02em]">Counselling</span>
            <span className="text-[13px] text-muted">Missed points in 3 of 7</span>
          </div>
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
            const pct = c.played ? Math.round((c.passed / c.played) * 100) : 0;
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
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <span className="flex justify-between text-sm font-bold">
                      <span>{c.played} played</span>
                      <span className="text-muted">{c.passed} passed</span>
                    </span>
                    <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-[5px] bg-line-soft">
                      <span className="block h-full" style={{ width: `${pct}%`, background: c.bar }} />
                    </span>
                  </div>
                  <Link
                    href="/session"
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
