import type { Metadata } from "next";
import Link from "next/link";
import { Pip } from "@/components/Pip";
import { CheckCircle, LogoMark } from "@/components/icons";

export const metadata: Metadata = { title: "Case debrief" };

// Example content for design only; needs pharmacist review.
const failConditions = [
  { name: "Serious harm or injury", pass: true, note: "Nothing was supplied before the duplication was raised." },
  {
    name: "Risk not reasonably minimised",
    pass: false,
    note: "Other medicines weren't explored, so warfarin went unnoticed. 11:05 · “Okay, so just the one tablet then.”",
  },
  { name: "Practising legally and professionally", pass: true, note: "Contacted the GP before changing therapy." },
  { name: "Reasonable factual knowledge", pass: true, note: "04:30 · “Both of these are atorvastatin, just different brands.”" },
];

const skills: [string, "Yes" | "Partly"][] = [
  ["History taking", "Partly"],
  ["Issue identified", "Yes"],
  ["Options considered", "Yes"],
  ["Prescriber contacted well", "Yes"],
  ["Clear counselling", "Partly"],
  ["Prompt corrective action", "Yes"],
];

const replays = [
  {
    when: "11:05 · You said",
    said: "“Okay, so just the one tablet then. I'll give the hospital a call.”",
    better:
      "“Before I call, are you taking anything else? Including medicines from other doctors, or anything you buy yourself?”",
  },
  {
    when: "14:20 · You said to the GP",
    said: "“I think he might be on two statins, so maybe he should stop one?”",
    better:
      "“He has both brand and generic atorvastatin 40 mg at home. I recommend he continues one product only. Can you confirm?”",
  },
];

const counselling: [string, boolean][] = [
  ["Dose", true],
  ["Timing", true],
  ["Side effects", false],
  ["What to watch for", false],
  ["When to return", true],
];

const navLink = "inline-flex min-h-11 items-center rounded-xl px-4 no-underline";

export default function DebriefPage() {
  return (
    <div className="min-h-screen bg-canvas text-base leading-normal">
      {/* App bar */}
      <header className="border-b border-line-soft bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 text-ink no-underline hover:text-ink">
            <LogoMark size={28} />
            <span className="text-[21px] font-semibold tracking-[-0.02em]">pharmify</span>
          </Link>
          <nav aria-label="App" className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold">
            <Link href="/home" className={`${navLink} text-ink-2 hover:text-ink`}>Cases</Link>
            <Link href="/debrief" aria-current="page" className={`${navLink} bg-pink-tint text-pink-deep hover:text-pink-deep`}>
              Debriefs
            </Link>
            <a href="#profile" className={`${navLink} text-ink-2 hover:text-ink`}>Profile</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pt-8 pb-[72px]">
        {/* Result hero */}
        <section
          aria-label="Result"
          className="flex flex-wrap items-center gap-8 rounded-[32px] border-[1.5px] border-line bg-white px-10 py-8 shadow-card"
        >
          <Pip mood="thinking" size={130} />
          <div className="flex flex-[1_1_380px] flex-col gap-2.5">
            <p className="m-0 text-[15px] font-semibold text-subtle">Case 04 · Doubling up · debrief</p>
            <h1 className="m-0 text-[clamp(30px,3.4vw,44px)] leading-[1.04] font-semibold tracking-[-0.015em] text-balance">
              So close. One fail condition to fix.
            </h1>
            <p className="m-0 max-w-[52ch] text-muted">
              You spotted the duplicate brand and got the GP on side. The miss was the other medicines question, and
              on the day that one counts. Let&apos;s look at it.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/session"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-ink bg-sun px-[26px] font-bold text-ink no-underline shadow-pop hover:text-ink"
            >
              Replay with new details
            </Link>
            <Link
              href="/home"
              className="inline-flex min-h-12 items-center justify-center rounded-[14px] px-[22px] font-semibold text-ink no-underline hover:text-ink"
            >
              Back to case map
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Round stats" className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
          <div className="flex flex-col gap-0.5 rounded-3xl bg-alert-tint px-6 py-[22px]">
            <span className="text-sm font-medium text-alert-deep">Result</span>
            <span className="text-[28px] font-semibold tracking-[-0.02em] text-alert">Not yet a pass</span>
          </div>
          {[
            ["Fail conditions cleared", "3 / 4"],
            ["Hidden facts found", "2 / 3"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-3xl bg-white px-6 py-[22px]">
              <span className="text-sm font-medium text-subtle">{label}</span>
              <span className="text-[28px] font-semibold tracking-[-0.02em]">{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5 rounded-3xl bg-white px-6 py-[22px]">
            <span className="text-sm font-medium text-subtle">Time used</span>
            <span className="font-mono text-[28px] font-medium">19:42</span>
          </div>
        </section>

        {/* Fail conditions */}
        <section aria-labelledby="fc" className="flex flex-col gap-[18px] rounded-[28px] bg-white p-7">
          <h2 id="fc" className="m-0 text-2xl font-semibold tracking-[-0.02em]">Fail conditions</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-3.5">
            {failConditions.map((f) => (
              <div
                key={f.name}
                className={`flex flex-col gap-2 rounded-[20px] p-[18px] ${
                  f.pass ? "bg-canvas" : "border-2 border-alert bg-alert-tint"
                }`}
              >
                <span
                  className={`self-start rounded-full px-2.5 py-[3px] text-[13px] font-bold ${
                    f.pass ? "bg-pink-tint text-pink-deep" : "bg-alert text-white"
                  }`}
                >
                  {f.pass ? "Pass" : "Fail"}
                </span>
                <h3 className="m-0 text-base font-semibold">{f.name}</h3>
                <p className={`m-0 text-sm ${f.pass ? "text-muted" : "text-[#4A3A35]"}`}>{f.note}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-start gap-6">
          {/* Left column */}
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
            <section aria-labelledby="facts" className="flex flex-col gap-3.5 rounded-[28px] bg-ink p-7 text-on-ink">
              <h2 id="facts" className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-white">Hidden facts</h2>
              {["Still has the generic at home", "Nobody told him to stop it"].map((fact) => (
                <div key={fact} className="flex items-start gap-3 rounded-[14px] bg-ink-soft px-3.5 py-3">
                  <CheckCircle fill="#C4ADF5" stroke="#16112A" className="mt-0.5 flex-none" />
                  <span>{fact}</span>
                </div>
              ))}
              <div className="flex items-start gap-3 rounded-[14px] border-2 border-dashed border-sun px-3.5 py-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 flex-none">
                  <circle cx="10" cy="10" r="8" stroke="#FFC94D" strokeWidth="2" />
                  <path d="M10 6v5M10 13.5v.5" stroke="#FFC94D" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="flex flex-col">
                  <span className="font-semibold text-white">Missed: takes warfarin, sometimes forgets doses</span>
                  <span className="text-sm text-on-ink-muted">Unlocks with: “Are you taking any other medicines?”</span>
                </span>
              </div>
            </section>

            <section aria-labelledby="comp" className="flex flex-col gap-2.5 rounded-[28px] bg-white p-7">
              <h2 id="comp" className="m-0 mb-1.5 text-[22px] font-semibold tracking-[-0.02em]">Skills check</h2>
              {skills.map(([skill, result], idx) => (
                <div
                  key={skill}
                  className={`flex justify-between gap-3 py-2.5 ${idx < skills.length - 1 ? "border-b border-line-soft" : ""}`}
                >
                  <span>{skill}</span>
                  <span className={`font-bold ${result === "Yes" ? "text-pink-deep" : "text-alert"}`}>{result}</span>
                </div>
              ))}
            </section>
          </div>

          {/* Replays */}
          <section aria-labelledby="moments" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[28px] bg-white p-7">
            <h2 id="moments" className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Instant replays</h2>
            {replays.map((r) => (
              <article
                key={r.when}
                className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5 border-b border-line-soft pb-5"
              >
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[13px] text-subtle">{r.when}</span>
                  <p className="m-0 rounded-2xl bg-canvas px-4 py-3.5">{r.said}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-bold text-pink-link">Try this instead</span>
                  <p className="m-0 rounded-2xl bg-pink-tint px-4 py-3.5">{r.better}</p>
                </div>
              </article>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold">Counselling</span>
              {counselling.map(([point, covered]) => (
                <span
                  key={point}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    covered ? "bg-pink-tint text-pink-deep" : "border-2 border-dashed border-alert text-alert"
                  }`}
                >
                  {point}
                </span>
              ))}
            </div>
            <p className="m-0 text-[13px] text-subtle">
              Practice feedback, not a predicted exam result. Example content for design only; needs pharmacist review.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
