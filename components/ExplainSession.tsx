"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebriefReport } from "@/components/DebriefReport";
import { Pip } from "@/components/Pip";
import { CaseDocuments, GradingPanel, SessionHeader, timeCheck, type Phase } from "@/components/SessionChrome";
import type { MicError } from "@/hooks/useRecorder";
import { useSegmentRecorder } from "@/hooks/useSegmentRecorder";
import type { PublicCase } from "@/lib/cases/schema";
import type { Debrief } from "@/lib/session/report";

/** One part of the spoken answer, as it comes back from transcription. */
type Segment = { t: number; status: "sending" | "done" | "failed"; text: string };

const BARS = 24;
const TEXT_LIMIT = 4000;

/**
 * Ethical and legal cases. No role play: the candidate reads the case, starts the clock and
 * explains, uninterrupted, what they would do and why. Then the answer is marked.
 *
 * With voice, the answer is recorded in short segments that are transcribed and saved while
 * the candidate keeps talking (/api/session/answer). Without voice, or if the mic is
 * unavailable, they type the answer instead.
 */
export function ExplainSession({ case: c, voice = false }: { case: PublicCase; voice?: boolean }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [remaining, setRemaining] = useState(c.partSeconds);
  const [mode, setMode] = useState<"speak" | "type">(voice ? "speak" : "type");
  const [typed, setTyped] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);
  /** Uploads run one after another, so the saved answer stays in order. */
  const uploadsRef = useRef<Promise<void>>(Promise.resolve());
  const finishingRef = useRef(false);
  const typedRef = useRef("");
  const barsRef = useRef<HTMLDivElement>(null);
  // Destructured: these functions are stable, so the clock effect doesn't restart every render.
  const { start: startRecording, stop: stopRecording, level, recording } = useSegmentRecorder();

  const elapsed = c.partSeconds - remaining;

  const upload = useCallback((audio: Blob, t: number) => {
    const index = t;
    setSegments((s) => [...s, { t: index, status: "sending", text: "" }]);
    const send = async () => {
      const form = new FormData();
      form.append("sessionId", sessionIdRef.current ?? "");
      form.append("t", String(t));
      form.append("audio", audio);
      for (let attempt = 1; ; attempt++) {
        try {
          const res = await fetch("/api/session/answer", { method: "POST", body: form });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
          const text = String(data.text ?? "");
          setSegments((s) => s.map((x) => (x.t === index ? { ...x, status: "done", text } : x)));
          return;
        } catch {
          if (attempt >= 2) {
            setSegments((s) => s.map((x) => (x.t === index ? { ...x, status: "failed" } : x)));
            return;
          }
        }
      }
    };
    uploadsRef.current = uploadsRef.current.then(send);
  }, []);

  /** Stops recording (or sends the typed answer), waits for every upload, then marks it. */
  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setError(null);
    try {
      await stopRecording();
      const text = typedRef.current.trim();
      if (text) {
        uploadsRef.current = uploadsRef.current.then(async () => {
          const form = new FormData();
          form.append("sessionId", sessionIdRef.current ?? "");
          form.append("t", "0");
          form.append("text", text.slice(0, TEXT_LIMIT));
          await fetch("/api/session/answer", { method: "POST", body: form });
        });
      }
      await uploadsRef.current;
    } finally {
      setPhase("grading");
      setFinishing(false);
    }
    try {
      const res = await fetch("/api/session/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Marking failed (${res.status})`);
      setDebrief(data as Debrief);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marking failed");
    }
  }, [stopRecording]);

  const regrade = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/session/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Marking failed (${res.status})`);
      setDebrief(data as Debrief);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Marking failed");
    }
  }, []);

  async function start() {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Couldn't start the session (${res.status})`);
      sessionIdRef.current = data.sessionId;
      elapsedRef.current = 0;
      if (mode === "speak") {
        try {
          await startRecording(upload, () => elapsedRef.current);
        } catch (err) {
          setMode("type");
          setError(
            (err as MicError) === "blocked"
              ? "Pharmify can't use your microphone, so type your answer instead. (You can allow the mic in your browser for next time.)"
              : "This browser can't record audio, so type your answer instead.",
          );
        }
      }
      setPhase("live");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the session");
    } finally {
      setStarting(false);
    }
  }

  // The clock. When it runs out, the answer is over.
  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => {
      const next = Math.max(0, c.partSeconds - elapsedRef.current - 1);
      elapsedRef.current = c.partSeconds - next;
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        void finish();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish, c.partSeconds]);

  // Mic meter: bars follow the voice, so the candidate can see they're being heard.
  useEffect(() => {
    if (!recording) return;
    const recent: number[] = Array(BARS).fill(0);
    let frame = 0;
    const tick = () => {
      recent.shift();
      recent.push(level());
      const els = barsRef.current?.children;
      if (els) for (let i = 0; i < els.length; i++) (els[i] as HTMLElement).style.height = `${6 + recent[i] * 42}px`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [recording, level]);

  function replay() {
    sessionIdRef.current = null;
    elapsedRef.current = 0;
    uploadsRef.current = Promise.resolve();
    finishingRef.current = false;
    typedRef.current = "";
    setTyped("");
    setSegments([]);
    setRemaining(c.partSeconds);
    setDebrief(null);
    setError(null);
    setPhase("ready");
  }

  if (phase === "review" && debrief) {
    return (
      <div className="min-h-screen bg-canvas text-base leading-normal">
        <SessionHeader c={c} phase={phase} remaining={remaining} elapsed={elapsed} notice={null} />
        <DebriefReport debrief={debrief} onReplay={replay} replayHref={`/session/${c.id}`} />
      </div>
    );
  }

  const minutes = Math.round(c.partSeconds / 60);
  const heard = segments.filter((s) => s.status === "done" && s.text).map((s) => s.text);
  const failed = segments.some((s) => s.status === "failed");

  return (
    <div className="flex min-h-screen flex-col bg-white text-base leading-normal">
      <SessionHeader c={c} phase={phase} remaining={remaining} elapsed={elapsed} notice={timeCheck(remaining, c.partSeconds)} />

      <main className="flex flex-1 flex-wrap items-stretch">
        <CaseDocuments c={c} />

        <section aria-label="Your answer" className="flex min-w-0 flex-[999_1_560px] flex-col">
          {phase === "ready" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
              <Pip mood="exam" size={110} />
              <h1 className="m-0 text-[clamp(26px,2.6vw,34px)] font-bold tracking-[-0.02em]">
                Read the case, then explain what you would do.
              </h1>
              <p className="m-0 max-w-[50ch] text-muted">
                Take as long as you need to read. When you start, you&apos;ll have {minutes} minutes to talk through how you
                would handle it and why. No one will reply or interrupt; the examiner only gives a one-minute warning.
              </p>
              <p className="m-0 max-w-[50ch] text-[15px] text-subtle">
                {mode === "speak"
                  ? "Speak as you would to the examiner. Your answer is recorded and transcribed for marking."
                  : "Type your answer as you would say it."}
              </p>
              <button
                type="button"
                onClick={() => void start()}
                disabled={starting}
                className="min-h-[60px] cursor-pointer rounded-[18px] border-2 border-ink bg-sun px-9 text-[19px] font-bold text-ink shadow-pop-md disabled:cursor-wait disabled:opacity-70"
              >
                {starting ? "Starting…" : mode === "speak" ? "Start and begin speaking" : "Start the clock"}
              </button>
              {voice && (
                <button
                  type="button"
                  onClick={() => setMode(mode === "speak" ? "type" : "speak")}
                  className="cursor-pointer border-0 bg-transparent text-sm font-semibold text-pink-link underline"
                >
                  {mode === "speak" ? "Type my answer instead" : "Speak my answer instead"}
                </button>
              )}
              {error && (
                <p role="alert" className="m-0 font-semibold text-alert">
                  {error}
                </p>
              )}
            </div>
          )}

          {phase === "grading" && <GradingPanel error={error} onRetry={() => void regrade()} />}

          {phase === "live" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-10 text-center">
              {mode === "speak" ? (
                <>
                  <div className="relative grid size-[180px] place-items-center">
                    <span aria-hidden="true" className="absolute inset-3 animate-ring rounded-full bg-pink opacity-25" />
                    <span className="relative grid size-[150px] place-items-center rounded-full border-[3px] border-white bg-pink-tint shadow-[0_24px_48px_-20px_rgba(230,80,150,0.45)]">
                      <Pip mood="exam" size={120} />
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <span role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-alert">
                      <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-alert" />
                      Recording your answer
                    </span>
                    <div ref={barsRef} aria-hidden="true" className="flex h-12 items-center gap-1">
                      {Array.from({ length: BARS }, (_, i) => (
                        <span key={i} className="block h-1.5 w-1.5 rounded-full bg-pink" />
                      ))}
                    </div>
                    <p className="m-0 max-w-[44ch] text-muted">
                      Talk through what you would do and why. Pip is listening, not replying.
                    </p>
                  </div>
                  {heard.length > 0 && (
                    <div className="w-full max-w-[640px] rounded-2xl bg-canvas p-4 text-left text-sm text-muted">
                      <p className="m-0 mb-1 font-semibold text-ink">What we&apos;ve heard so far</p>
                      <p className="m-0">{heard.join(" ")}</p>
                    </div>
                  )}
                  {failed && (
                    <p role="alert" className="m-0 text-sm font-semibold text-alert">
                      Part of your answer didn&apos;t upload. Keep going; the rest is being saved.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex w-full max-w-[720px] flex-col gap-2 text-left">
                  <label htmlFor="answer" className="font-semibold">
                    Your answer
                  </label>
                  <textarea
                    id="answer"
                    autoFocus
                    value={typed}
                    maxLength={TEXT_LIMIT}
                    onChange={(e) => {
                      setTyped(e.target.value);
                      typedRef.current = e.target.value;
                    }}
                    placeholder="What would you do in this situation, and why?"
                    className="min-h-[280px] w-full resize-y rounded-2xl border-[1.5px] border-line bg-white p-4 text-base text-ink outline-none focus:ring-2 focus:ring-pink"
                  />
                  <span className="self-end text-[13px] text-subtle">
                    {typed.length} / {TEXT_LIMIT}
                  </span>
                </div>
              )}
              {error && (
                <p role="alert" className="m-0 max-w-[60ch] text-sm font-semibold text-alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={() => void finish()}
                disabled={finishing}
                className="min-h-[56px] cursor-pointer rounded-full border-2 border-ink bg-sun px-8 text-[17px] font-bold text-ink shadow-pop disabled:cursor-wait disabled:opacity-60"
              >
                {finishing ? "Saving your answer…" : "I'm finished"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
