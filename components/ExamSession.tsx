"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pip } from "@/components/Pip";
import { LogoMark, MicIcon } from "@/components/icons";

const PART_SECONDS = 20 * 60;

// Mock dialogue until the voice loop is wired up.
const AGENTS = {
  patient: {
    tab: "Patient · Mr R.",
    speaking: "Mr R. is speaking",
    line: "“I've still got the old ones at home. Nobody said to stop them.”",
    you: "“Are you still taking the tablets you had before you went in?”",
  },
  gp: {
    tab: "Call the GP",
    speaking: "Dr [PRESCRIBER] is speaking",
    line: "“I'm between patients. What do you need from me?”",
    you: "“I'm calling about Mr R.'s discharge script for atorvastatin.”",
  },
} as const;

type Agent = keyof typeof AGENTS;

function formatClock(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const docLabel = "m-0 text-xs font-medium tracking-[0.05em] text-subtle uppercase";
const roundBtn = "grid size-[52px] cursor-pointer place-items-center rounded-full border-0";

export function ExamSession() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(PART_SECONDS);
  const [agent, setAgent] = useState<Agent>("patient");
  const [muted, setMuted] = useState(false);
  const [talking, setTalking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // The orchestrator, not a model, ends the part when time runs out.
  useEffect(() => {
    if (remaining === 0) router.push("/debrief");
  }, [remaining, router]);

  const a = AGENTS[agent];
  const elapsedPct = ((PART_SECONDS - remaining) / PART_SECONDS) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-white text-base leading-normal">
      {/* Top bar */}
      <header className="border-b border-line-soft">
        <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link href="/home" aria-label="Back to case map" className="grid size-11 place-items-center rounded-xl">
              <LogoMark size={28} />
            </Link>
            <div className="flex flex-col leading-[1.25]">
              <span className="text-lg font-semibold tracking-[-0.02em]">Mystery case · Complex clinical</span>
              <span className="text-[13px] text-subtle">Community pharmacy, NSW</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-ink py-1 pr-3.5 pl-1.5 text-[13px] font-semibold text-white">
              <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-white">
                <Pip mood="exam" size={30} />
              </span>
              Exam mode · Pip&apos;s locked in
            </span>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="block h-1 w-[120px] rounded-sm bg-line-soft">
                <span className="block h-1 rounded-sm bg-pink" style={{ width: `${elapsedPct}%` }} />
              </span>
              <span role="timer" aria-label="Time remaining" className="font-mono text-xl font-medium">
                {formatClock(remaining)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-wrap items-stretch">
        {/* Case documents */}
        <aside
          aria-label="Case documents"
          className="flex max-w-[400px] flex-[1_1_340px] flex-col gap-5 border-r border-line-soft bg-canvas p-6"
        >
          <div className="flex flex-col gap-2">
            <h2 className={docLabel}>Question sheet</h2>
            <p className="m-0 text-[15px]">
              A man in his late sixties presents a new prescription from his hospital discharge. Manage the situation
              as you would in practice. You may contact the prescriber.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className={docLabel}>Prescription</h2>
              <button
                type="button"
                aria-label="Enlarge prescription"
                className="-my-2.5 -mr-2.5 grid size-11 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M11 3h4v4M7 15H3v-4M15 3l-5 5M3 15l5-5"
                    stroke="#403A50"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <span className="font-semibold">Atorvastatin 40 mg tablets (brand)</span>
            <span className="text-sm text-subtle">One tablet at night · Qty 30 · 5 repeats</span>
            <span className="border-t border-line-soft pt-2 text-[13px] text-subtle">
              [HOSPITAL] · Dr [PRESCRIBER] · Mr R. [SURNAME], 68
            </span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
            <h2 className={docLabel}>Dispensing history</h2>
            {[
              ["Atorvastatin 40 mg (generic)", "19 Oct"],
              ["Atorvastatin 40 mg (generic)", "21 Sep"],
            ].map(([drug, date], idx) => (
              <div
                key={date}
                className={`flex justify-between gap-3 py-2 text-sm ${idx === 0 ? "border-b border-line-soft" : ""}`}
              >
                <span>{drug}</span>
                <span className="font-mono text-subtle">{date}</span>
              </div>
            ))}
          </div>
          <p className="m-0 text-[13px] text-subtle">Open book: keep your own references beside you.</p>
        </aside>

        {/* Voice stage */}
        <section aria-label="Voice role play" className="flex min-w-0 flex-[999_1_560px] flex-col">
          <div className="flex justify-center px-6 pt-5">
            <div role="group" aria-label="Who you are speaking with" className="inline-flex gap-1 rounded-xl bg-chip p-1">
              {(Object.keys(AGENTS) as Agent[]).map((key) => {
                const on = agent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAgent(key)}
                    className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-4 text-sm font-medium ${
                      on ? "bg-white text-ink shadow-[0_1px_2px_rgba(22,17,42,0.12)]" : "bg-transparent text-ink-2"
                    }`}
                  >
                    {AGENTS[key].tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orb */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10 text-center">
            <div aria-hidden="true" className="relative grid size-60 place-items-center">
              <span className="absolute inset-5 animate-ring rounded-full bg-pink opacity-25" />
              <span className="absolute inset-5 animate-ring-late rounded-full bg-pink opacity-25" />
              <span className="absolute inset-5 rounded-full bg-pink opacity-10" />
              <span className="relative flex size-[148px] items-center justify-center gap-1.5 rounded-full bg-pink shadow-[0_24px_48px_-20px_rgba(230,80,150,0.45)]">
                {[22, 46, 32, 54, 28].map((h, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 rounded-[3px] bg-ink ${talking ? "" : "animate-bar"}`}
                    style={{ height: talking ? 8 : h, animationDelay: `${idx * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3.5">
              <span className="text-sm text-subtle">{talking ? "Listening to you…" : a.speaking}</span>
              <p
                aria-live="polite"
                className="m-0 max-w-[30ch] text-[clamp(22px,2.4vw,30px)] leading-[1.35] tracking-[-0.02em] text-balance"
              >
                {a.line}
              </p>
            </div>
            <p className="m-0 text-sm text-subtle">You said: {a.you}</p>
            {showTranscript && (
              <div className="w-full max-w-[520px] rounded-2xl bg-canvas p-4 text-left text-sm">
                <p className="m-0 mb-2 font-semibold">Transcript so far</p>
                <p className="m-0 text-muted">You: {a.you}</p>
                <p className="m-0 text-muted">
                  {agent === "patient" ? "Mr R." : "GP"}: {a.line}
                </p>
              </div>
            )}
          </div>

          {/* Control dock */}
          <div className="flex justify-center px-6 pb-8">
            <div className="flex items-center gap-3 rounded-full border-[1.5px] border-line bg-white p-2.5 shadow-card">
              <button
                type="button"
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={muted}
                onClick={() => setMuted(!muted)}
                className={`${roundBtn} ${muted ? "bg-alert-tint" : "bg-chip"}`}
              >
                <MicIcon />
              </button>
              <button
                type="button"
                disabled={muted}
                onPointerDown={() => setTalking(true)}
                onPointerUp={() => setTalking(false)}
                onPointerLeave={() => setTalking(false)}
                className="inline-flex min-h-[60px] cursor-pointer items-center gap-2.5 rounded-full border-2 border-ink bg-sun px-[30px] text-[17px] font-bold text-ink shadow-pop disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MicIcon filled width={18} height={18} />
                {talking ? "Listening…" : "Hold to speak"}
              </button>
              <button
                type="button"
                aria-label={showTranscript ? "Hide transcript" : "Show transcript"}
                aria-pressed={showTranscript}
                onClick={() => setShowTranscript(!showTranscript)}
                className={`${roundBtn} ${showTranscript ? "bg-pink-tint" : "bg-chip"}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 5h12M4 10h12M4 15h7" stroke="#16112A" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              <Link
                href="/debrief"
                className="inline-flex min-h-[52px] items-center rounded-full bg-alert-tint px-5 font-semibold text-alert no-underline hover:text-alert"
              >
                Finish part
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
