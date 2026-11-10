"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark, MicIcon } from "@/components/icons";
import { Pip } from "@/components/Pip";
import {
  AU_STATES,
  INTERNSHIP_STAGE_IDS,
  INTERNSHIP_STAGES,
  sittingLabel,
  type ProfileUpdate,
} from "@/lib/onboarding";
import { closeAudioContext } from "@/lib/voice/audioContext";

/**
 * Five steps from the "Onboarding" design board: welcome, exam sitting, state and
 * internship, mic check, how interviews work. Answers are saved as each step is left,
 * so leaving halfway loses nothing.
 */

const STEPS = 5;
const NOT_BOOKED = "not-booked";

type Initial = {
  examSitting: string | null;
  sittingAnswered: boolean;
  state: string | null;
  internshipStage: string | null;
};

async function save(update: ProfileUpdate) {
  const res = await fetch("/api/me/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("save failed");
}

const choice =
  "min-h-12 rounded-[14px] px-[18px] text-base font-semibold text-ink cursor-pointer aria-pressed:border-2 aria-pressed:border-pink-link aria-pressed:bg-pink-tint not-aria-pressed:border-[1.5px] not-aria-pressed:border-[#DDD8E6] not-aria-pressed:bg-white";
const primary =
  "inline-flex min-h-[52px] items-center rounded-[14px] border-2 border-ink bg-sun px-7 text-[17px] font-bold text-ink shadow-pop cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";

function Choices<T extends string>({
  label,
  options,
  value,
  onPick,
  min,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: string | null;
  onPick: (id: T) => void;
  min: number;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onPick(o.id)} className={choice}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Onboarding({ sittings, initial }: { sittings: string[]; initial: Initial }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sitting, setSitting] = useState<string | null>(
    initial.sittingAnswered ? (initial.examSitting ?? NOT_BOOKED) : null,
  );
  const [state, setState] = useState(initial.state);
  const [stage, setStage] = useState(initial.internshipStage);
  const [micOk, setMicOk] = useState(false);
  const [micSkipped, setMicSkipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLDivElement>(null);

  // A saved sitting that has since passed still shows, so the choice isn't silently lost.
  const sittingOptions = [...new Set([...(sitting && sitting !== NOT_BOOKED ? [sitting] : []), ...sittings])]
    .sort()
    .map((s) => ({ id: s, label: sittingLabel(s) }));

  const ready = [true, Boolean(sitting), Boolean(state && stage), micOk || micSkipped, true][step];

  useEffect(() => {
    heading.current?.querySelector("h1")?.focus();
  }, [step]);

  async function next() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (step === 1) await save({ examSitting: sitting === NOT_BOOKED ? null : sitting });
      if (step === 2) await save({ state: state as ProfileUpdate["state"], internshipStage: stage as ProfileUpdate["internshipStage"] });
      if (step === 3 && micOk) await save({ micChecked: true });
      setStep((s) => Math.min(STEPS - 1, s + 1));
    } catch {
      setError("We couldn't save that. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function finish(href: string) {
    setBusy(true);
    setError(null);
    try {
      await save({ completed: true });
      router.push(href);
    } catch {
      setError("We couldn't save that. Check your connection and try again.");
      setBusy(false);
    }
  }

  const h1 = "m-0 text-[30px] font-bold tracking-[-0.02em] outline-none";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] py-5">
        <span className="inline-flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="text-[22px] font-bold tracking-[-0.02em] text-brand">Pharmify</span>
        </span>
        <div className="flex items-center gap-3.5">
          <span className="text-sm text-subtle">
            Step {step + 1} of {STEPS}
          </span>
          <span aria-hidden="true" className="block h-2 w-40 overflow-hidden rounded bg-line">
            <span className="block h-full bg-pink transition-[width]" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-[clamp(16px,4vw,40px)] pt-4 pb-12">
        <div
          ref={heading}
          className="flex w-full max-w-[640px] flex-col gap-6 rounded-[28px] border-[1.5px] border-line bg-white p-[clamp(24px,4vw,44px)] shadow-card"
        >
          {step === 0 && (
            <div className="flex flex-col items-center gap-[18px] text-center">
              <div className="relative size-[150px] overflow-hidden rounded-full bg-[#FFE3F1]">
                <div className="absolute top-[-4px] left-3">
                  <Pip mood="celebrate" size={126} />
                </div>
              </div>
              <h1 tabIndex={-1} className={`${h1} text-[34px]`}>
                Hi, I&apos;m Pip.
              </h1>
              <p className="m-0 max-w-[40ch] text-[17px] text-muted">
                I&apos;ll be your coach. A few quick questions and you&apos;ll be ready for your first interview.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-[18px]">
              <div>
                <h1 tabIndex={-1} className={h1}>
                  When&apos;s your oral exam?
                </h1>
                <p className="mt-1.5 mb-0 text-muted">We&apos;ll pace your practice to your sitting.</p>
              </div>
              <Choices
                label="Exam sitting"
                min={150}
                value={sitting}
                onPick={setSitting}
                options={[...sittingOptions, { id: NOT_BOOKED, label: "Not booked yet" }]}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-[18px]">
              <div>
                <h1 tabIndex={-1} className={h1}>
                  Where are you practising?
                </h1>
                <p className="mt-1.5 mb-0 text-muted">Legal cases follow your state or territory&apos;s rules.</p>
              </div>
              <Choices
                label="State or territory"
                min={110}
                value={state}
                onPick={setState}
                options={AU_STATES.map((s) => ({ id: s, label: s }))}
              />
              <div className="flex flex-col gap-2.5">
                <span className="font-semibold">How far through your internship?</span>
                <Choices
                  label="Internship progress"
                  min={170}
                  value={stage}
                  onPick={setStage}
                  options={INTERNSHIP_STAGE_IDS.map((s) => ({ id: s, label: INTERNSHIP_STAGES[s] }))}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <MicCheck ok={micOk} onHeard={() => setMicOk(true)} onSkip={() => { setMicSkipped(true); setStep(4); }} h1={h1} />
          )}

          {step === 4 && (
            <div className="flex flex-col gap-[18px]">
              <div>
                <h1 tabIndex={-1} className={h1}>
                  How interviews work
                </h1>
              </div>
              <ul className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
                {[
                  [
                    "On the clock",
                    "Clinical cases are a 20-minute role play. Ethical and legal cases: 5 minutes to explain what you'd do.",
                    "bg-pink-tint",
                  ],
                  ["Open book", "Keep your own references beside you.", "bg-sun-tint"],
                  ["No hints", "Pip locks in. Patients only answer what you ask.", "bg-lilac-tint"],
                  ["Debrief after", "See what to fix first, marked against the Board's criteria.", "bg-ok-tint"],
                ].map(([title, body, bg]) => (
                  <li key={title} className={`flex flex-col gap-1 rounded-[18px] p-4 ${bg}`}>
                    <b className="font-bold">{title}</b>
                    <span className="text-[15px] text-ink-2">{body}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="m-0 font-semibold text-alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="min-h-12 cursor-pointer rounded-xl bg-transparent px-[18px] font-semibold text-ink-2"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="ml-auto flex flex-wrap gap-2.5">
              {step === STEPS - 1 ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => finish("/home")}
                    className="inline-flex min-h-[52px] cursor-pointer items-center rounded-[14px] px-[18px] font-semibold text-ink-2"
                  >
                    Go to dashboard
                  </button>
                  <button type="button" disabled={busy} onClick={() => finish("/session")} className={primary}>
                    Start my first interview
                  </button>
                </>
              ) : (
                <button type="button" disabled={!ready || busy} onClick={next} className={primary}>
                  {step === 0 ? "Let's go" : "Continue"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const BARS = 14;
/** RMS above this, held for a few frames, counts as hearing the candidate. */
const HEARD_LEVEL = 0.04;
const HEARD_FRAMES = 12;

type MicState = "idle" | "asking" | "listening" | "blocked" | "unsupported";

/** Real mic check: asks for the microphone, shows its level, and passes once speech is heard. */
function MicCheck({ ok, onHeard, onSkip, h1 }: { ok: boolean; onHeard: () => void; onSkip: () => void; h1: string }) {
  const [mic, setMic] = useState<MicState>("idle");
  const bars = useRef<HTMLDivElement>(null);
  const stop = useRef<() => void>(() => {});

  useEffect(() => () => stop.current(), []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) return setMic("unsupported");
    setMic("asking");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setMic("blocked");
    }
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    const recent: number[] = Array(BARS).fill(0);
    let loud = 0;
    let heard = false;
    let raf = 0;

    const tick = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length);
      recent.shift();
      recent.push(rms);
      const els = bars.current?.children;
      if (els) for (let i = 0; i < els.length; i++) (els[i] as HTMLElement).style.height = `${4 + Math.min(1, recent[i] * 8) * 28}px`;
      loud = rms > HEARD_LEVEL ? loud + 1 : Math.max(0, loud - 1);
      if (!heard && loud >= HEARD_FRAMES) {
        heard = true;
        onHeard();
      }
      raf = requestAnimationFrame(tick);
    };
    stop.current = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      closeAudioContext(ctx);
    };
    setMic("listening");
    tick();
  }

  const status = ok
    ? "Sounds great. We can hear you clearly."
    : {
        idle: "Microphone not connected yet",
        asking: "Waiting for permission…",
        listening: "Listening… say the line above.",
        blocked: "Microphone blocked. Allow it in your browser's site settings, then try again.",
        unsupported: "This browser can't use a microphone. Try Chrome, Edge or Safari.",
      }[mic];

  return (
    <div className="flex flex-col items-center gap-[18px] text-center">
      <h1 tabIndex={-1} className={h1}>
        Let&apos;s check your mic
      </h1>
      <p className="m-0 max-w-[42ch] text-muted">
        Interviews are spoken out loud. Say: <b className="text-ink">“Good morning, how can I help you today?”</b>
      </p>
      <div className={`grid size-[120px] place-items-center rounded-full ${ok || mic === "listening" ? "bg-pink-tint" : "bg-chip"}`}>
        <MicIcon filled={mic === "listening"} width={44} height={44} />
      </div>
      <div ref={bars} aria-hidden="true" className="flex h-8 items-end gap-1">
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} className={`h-1 w-1.5 rounded-[3px] ${mic === "listening" ? "bg-pink" : "bg-line"}`} />
        ))}
      </div>
      <span role="status" className={`font-semibold ${ok ? "text-ok" : mic === "blocked" ? "text-alert" : "text-subtle"}`}>
        {status}
      </span>
      {(mic === "idle" || mic === "blocked") && !ok && (
        <button
          type="button"
          onClick={start}
          className="min-h-12 cursor-pointer rounded-xl border-[1.5px] border-ink bg-white px-5 font-semibold text-ink"
        >
          {mic === "blocked" ? "Try again" : "Allow microphone"}
        </button>
      )}
      {!ok && (
        <button type="button" onClick={onSkip} className="min-h-11 cursor-pointer bg-transparent text-sm font-semibold text-pink-link">
          Skip for now
        </button>
      )}
    </div>
  );
}
