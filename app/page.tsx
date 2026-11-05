import Link from "next/link";
import { Pip } from "@/components/Pip";
import { PilotSignup } from "@/components/PilotSignup";
import { CheckCircle, LogoMark } from "@/components/icons";

const container = "mx-auto max-w-[1160px] px-6";
const eyebrow = "m-0 text-[15px] font-semibold text-pink-link";
const h2 =
  "m-0 text-[clamp(34px,4vw,52px)] font-semibold leading-[1.02] tracking-[-0.015em] text-balance";
const card =
  "rounded-[28px] border-[1.5px] border-line bg-white p-7 shadow-card";


const rounds = [
  {
    tag: "Round 1",
    title: "Pick a case",
    body: "Choose from the case map or hit shuffle. Scan the prescription and dispensing history, then press start.",
  },
  {
    tag: "Round 2",
    title: "Talk it out",
    body: "Question the patient, then call a busy GP who wants a clear recommendation. Your own references stay beside you.",
  },
  {
    tag: "Debrief",
    title: "See how you did",
    body: "Get your marked report, the facts you missed and a model answer. Then replay with new hidden details.",
    highlight: true,
  },
];

const faqs = [
  {
    q: "Which part of the exam does it cover?",
    a: "Part C, problem solving and communication. Parts A and B are on the roadmap.",
  },
  {
    q: "Is Pharmify affiliated with the Pharmacy Board?",
    a: "No. Pharmify is independent and isn't endorsed by Ahpra or the Pharmacy Board of Australia. It helps you practise; it can't predict your result.",
  },
  {
    q: "Are these real exam questions?",
    a: "No. Every case is original, written from the published exam format and reviewed by a pharmacist.",
  },
  {
    q: "What happens to my voice recordings?",
    a: "[RETENTION AND HOSTING POLICY, IN PLAIN LANGUAGE]",
  },
];

const failConditions = [
  { name: "Serious harm or injury", pass: true },
  {
    name: "Risk not reasonably minimised",
    pass: false,
    note: "Other medicines weren't explored, so warfarin went unnoticed.",
  },
  { name: "Practising legally and professionally", pass: true },
  { name: "Reasonable factual knowledge", pass: true },
];

export default function LandingPage() {
  return (
    <div className="text-[17px] leading-[1.6]">
      {/* Nav */}
      <header>
        <div className={`${container} flex min-h-[76px] flex-wrap items-center justify-between gap-4`}>
          <Link href="#top" className="flex items-center gap-2.5 text-ink no-underline">
            <LogoMark size={38} />
            <span className="text-[22px] font-semibold tracking-[-0.02em] text-brand">Pharmify</span>
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-[30px] text-[15px] font-medium">
            <a href="#how" className="text-ink-2 no-underline">How it plays</a>
            <a href="#pip" className="text-ink-2 no-underline">Meet Pip</a>
            <a href="#feedback" className="text-ink-2 no-underline">Feedback</a>
            <a href="#faq" className="text-ink-2 no-underline">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 text-[15px]">
            <Link href="/home" className="inline-flex min-h-11 items-center px-3.5 font-semibold text-ink no-underline">
              Sign in
            </Link>
            <a
              href="#pilot"
              className="inline-flex min-h-11 items-center rounded-xl bg-ink px-[18px] font-semibold text-white no-underline shadow-pop-sm hover:text-white"
            >
              Join the pilot
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className={`${container} grid items-center grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-14 pt-[72px] pb-28`}>
        <div className="flex flex-col gap-[26px]">
          <span className="self-start rounded-full bg-sun-tint px-3.5 py-1.5 text-sm font-semibold text-sun-deep">
            Pharmacy oral exam · Part C
          </span>
          <h1 className="m-0 text-[clamp(46px,6.4vw,84px)] font-semibold leading-[0.96] tracking-[-0.02em] text-balance">
            Level up for your oral exam.
          </h1>
          <p className="m-0 max-w-[44ch] text-[clamp(18px,1.6vw,20px)] text-muted text-pretty">
            Talk through real-feeling cases with AI voice agents playing your patient and prescriber. Dig out the
            hidden facts, beat the twenty-minute clock, and get marked against the Board&apos;s criteria.
          </p>
          <div className="flex flex-wrap gap-3.5 pt-1">
            <a
              href="#pilot"
              className="inline-flex min-h-14 items-center rounded-2xl border-2 border-ink bg-pink px-7 font-bold text-ink no-underline shadow-pop hover:text-ink"
            >
              Join the pilot
            </a>
            <a
              href="#how"
              className="inline-flex min-h-14 items-center rounded-2xl border-2 border-ink bg-white px-6 font-semibold text-ink no-underline shadow-pop hover:text-ink"
            >
              See how it plays
            </a>
          </div>
          <p className="m-0 text-sm text-subtle">
            Small pilot group · [NEXT SITTING] sitting · Pilot price: [PILOT PRICE]
          </p>
        </div>

        {/* Hero stage */}
        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[36px] bg-pink-tint">
          <span aria-hidden="true" className="absolute size-[420px] rounded-full bg-pink-soft" />
          <div className="absolute top-10 right-8 max-w-[220px] rounded-[20px_20px_4px_20px] border-2 border-ink bg-white px-[18px] py-3.5 text-[19px] leading-[1.2] font-bold shadow-pop">
            Ready for your first case?
          </div>
          <div className="relative animate-float">
            <Pip mood="happy" size={230} />
          </div>
          <div className="absolute top-[120px] left-7 flex items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-2.5 text-sm font-semibold shadow-float">
            <span className="grid size-7 place-items-center rounded-lg bg-sun font-mono text-xs">04</span>
            Doubling up
          </div>
          <div className="absolute bottom-14 left-10 flex items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-2.5 text-sm font-semibold shadow-float">
            <CheckCircle fill="#FF8CC6" stroke="#16112A" ring="#16112A" />
            Hidden fact found
          </div>
          <div className="absolute right-9 bottom-[72px] rounded-[14px] bg-ink px-4 py-2.5 font-mono text-lg text-white shadow-[0_10px_30px_-12px_rgba(22,17,42,0.5)]">
            12:18
          </div>
        </div>
      </section>

      {/* How it plays */}
      <section id="how" className="bg-canvas">
        <div className={`${container} flex flex-col gap-14 py-28`}>
          <div className="flex max-w-[640px] flex-col gap-3.5">
            <p className={eyebrow}>How it plays</p>
            <h2 className={h2}>Pick a case. Talk it out. Debrief.</h2>
            <p className="m-0 text-muted">
              Every case is a twenty-minute round with one problem hidden inside. Find it, fix it, and counsel your
              patient before the clock runs out.
            </p>
          </div>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5 p-0">
            {rounds.map((r) => (
              <li
                key={r.title}
                className={`flex flex-col gap-3 rounded-3xl border-[1.5px] border-line p-7 shadow-card ${
                  r.highlight ? "bg-pink" : "bg-white"
                }`}
              >
                <span
                  className={`self-start rounded-full px-3 py-1 text-sm font-bold ${
                    r.highlight ? "bg-white" : "bg-sun"
                  }`}
                >
                  {r.tag}
                </span>
                <h3 className="m-0 text-[26px] font-semibold tracking-[-0.02em]">{r.title}</h3>
                <p className={`m-0 text-base ${r.highlight ? "text-plum" : "text-muted"}`}>{r.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Meet Pip */}
      <section id="pip" className={`${container} flex flex-col gap-14 py-32`}>
        <div className="flex flex-col items-center gap-3.5 text-center">
          <p className={eyebrow}>Meet Pip</p>
          <h2 className={`${h2} max-w-[18ch]`}>Your coach, who knows when to be quiet.</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-6">
          <div className="flex flex-wrap items-center gap-8 rounded-[32px] bg-pink-tint p-10">
            <Pip mood="celebrate" size={150} />
            <div className="flex flex-[1_1_200px] flex-col gap-2.5">
              <h3 className="m-0 text-[26px] font-semibold tracking-[-0.02em]">Between cases, Pip coaches</h3>
              <p className="m-0 text-base text-ink-2">
                Pip walks you through your debrief, celebrates your streaks and points you to the case you should
                play next.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-8 rounded-[32px] bg-ink p-10 text-on-ink">
            <Pip mood="exam" size={150} />
            <div className="flex flex-[1_1_200px] flex-col gap-2.5">
              <h3 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-white">
                In exam mode, Pip locks in
              </h3>
              <p className="m-0 text-base text-on-ink-muted">
                No hints, no nods, no reactions. Just time checks, exactly like the real examiner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case map */}
      <section className="bg-sun-tint">
        <div className={`${container} grid items-center grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-14 py-28`}>
          <div className="flex flex-col gap-[18px]">
            <p className="m-0 text-[15px] font-semibold text-sun-deep">Your case map</p>
            <h2 className={h2}>Ten cases. Every problem type.</h2>
            <p className="m-0 max-w-[44ch] text-sun-ink">
              One case for each problem type in the candidate guide, plus a combined boss case. All original, all
              signed off by a pharmacist. Clear them, keep your streak, and see which skills still need work.
            </p>
          </div>
          <div className={`${card} flex flex-col gap-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xl font-semibold">3 of 10 cleared</span>
              <span className="rounded-full bg-sun-soft px-3 py-1 text-sm font-semibold">3-day streak</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }, (_, i) => {
                const n = String(i + 1).padStart(2, "0");
                const style =
                  i < 3
                    ? "bg-pink font-bold text-ink"
                    : i === 3
                      ? "border-[1.5px] border-line bg-sun font-semibold"
                      : i === 9
                        ? "bg-ink font-semibold text-sun"
                        : "bg-tile font-bold text-subtle";
                return (
                  <span key={n} className={`grid aspect-square place-items-center rounded-2xl ${style}`}>
                    {n}
                  </span>
                );
              })}
            </div>
            <p className="m-0 text-sm text-subtle">Example progress. Case 10 is the combined boss case.</p>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section id="feedback" className={`${container} grid items-center grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-16 py-32`}>
        <div className="flex flex-col gap-[18px]">
          <p className={eyebrow}>The debrief</p>
          <h2 className={h2}>Fun to play. Serious about marking.</h2>
          <p className="m-0 max-w-[46ch] text-muted">
            An independent grader reads your full transcript against the Board&apos;s published criteria and quotes
            what you actually said for every judgement.
          </p>
          <ul className="mt-1.5 flex list-none flex-col gap-3 p-0 text-base">
            {[
              "All four fail conditions, marked pass or fail",
              "Hidden facts you found, and the ones you missed",
              "Key moments to replay, beside a model answer",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle size={22} className="mt-px flex-none" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} relative flex flex-col gap-3.5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-xl font-semibold">Fail conditions</span>
            <span className="text-sm text-subtle">Sample debrief</span>
          </div>
          {failConditions.map((f, i) => (
            <div
              key={f.name}
              className={`flex flex-col gap-1.5 py-3 ${i < failConditions.length - 1 ? "border-b border-line-soft" : ""}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px]">{f.name}</span>
                <span
                  className={`rounded-lg px-2.5 py-[3px] text-[13px] font-bold ${
                    f.pass ? "bg-pink-tint text-pink-deep" : "bg-alert-tint text-alert"
                  }`}
                >
                  {f.pass ? "Pass" : "Fail"}
                </span>
              </div>
              {f.note && <p className="m-0 text-sm text-subtle">{f.note}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-canvas">
        <div className="mx-auto flex max-w-[820px] flex-col gap-9 px-6 py-28">
          <h2 className={`${h2} text-center`}>Good questions</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <details key={f.q} open={i === 0} className="group rounded-[18px] bg-white px-6 py-5">
                <summary className="flex items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span aria-hidden="true" className="text-[22px] text-subtle">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="mt-2.5 mb-0 text-base text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pilot" className={`${container} py-28`}>
        <div className="flex flex-wrap items-center justify-between gap-10 rounded-[40px] bg-pink p-[clamp(36px,6vw,72px)] text-ink">
          <div className="flex flex-[1_1_420px] flex-col gap-[18px]">
            <h2 className="m-0 text-[clamp(36px,4.6vw,58px)] font-semibold leading-none tracking-[-0.02em] text-balance">
              Walk into the exam having played it before.
            </h2>
            <p className="m-0 max-w-[44ch] text-plum">
              We&apos;re opening a small pilot ahead of the [NEXT SITTING] sitting. Drop your email and Pip will save
              you a spot.
            </p>
            <PilotSignup />
          </div>
          <Pip mood="celebrate" size={190} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line-soft">
        <div className={`${container} flex flex-wrap items-start justify-between gap-6 pt-10 pb-12 text-sm text-subtle`}>
          <div className="flex max-w-[52ch] flex-col gap-2">
            <span className="text-lg font-semibold text-brand">Pharmify</span>
            <span>
              Independent exam practice. Not affiliated with or endorsed by Ahpra or the Pharmacy Board of Australia.
            </span>
            <span>© 2026 Pharmify</span>
          </div>
          <nav aria-label="Footer" className="flex gap-7">
            <Link href="/privacy" className="text-ink-2 no-underline">Privacy</Link>
            <Link href="/terms" className="text-ink-2 no-underline">Terms</Link>
            <a href="mailto:[CONTACT EMAIL]" className="text-ink-2 no-underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
