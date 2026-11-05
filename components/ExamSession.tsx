"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { DebriefReport } from "@/components/DebriefReport";
import { Pip } from "@/components/Pip";
import { CaseDocuments, GradingPanel, SessionHeader, clock, timeCheck, type Phase } from "@/components/SessionChrome";
import { PharmacyScene } from "@/components/PharmacyScene";
import { useCharacterVoice } from "@/hooks/useCharacterVoice";
import { type MicError, useRecorder } from "@/hooks/useRecorder";
import { useTalkingMouth } from "@/hooks/useTalkingMouth";
import type { AgentId, PublicCase, Turn } from "@/lib/cases/schema";
import { CAST, type CastId } from "@/lib/cast";
import type { Debrief } from "@/lib/session/report";

type Transcripts = Record<AgentId, Turn[]>;

const EMPTY: Transcripts = { patient: [], prescriber: [] };


const roundBtn = "grid size-[52px] cursor-pointer place-items-center rounded-full border-0";

/**
 * `voice`: characters speak their lines (ElevenLabs) and the candidate can hold to speak
 * instead of typing. Off when the server has no ELEVENLABS_API_KEY.
 */
export function ExamSession({ case: c, voice = false }: { case: PublicCase; voice?: boolean }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [remaining, setRemaining] = useState(c.partSeconds);
  const [agent, setAgent] = useState<AgentId>("patient");
  const [transcripts, setTranscripts] = useState<Transcripts>(EMPTY);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [starting, setStarting] = useState(false);
  /** Voice mode only: the text box is shown instead of "Hold to speak". */
  const [typing, setTyping] = useState(!voice);
  const [transcribing, setTranscribing] = useState(false);
  // Destructured so effects and callbacks depend on the stable functions, not a new object each render.
  const { play: playVoice, stop: stopVoice, unlock: unlockVoice, speaking, level: voiceLevel } = useCharacterVoice();
  const recorder = useRecorder();
  /** True while the "Hold to speak" button is held, so a release during the mic prompt still stops it. */
  const holdingRef = useRef(false);

  // Refs mirror state so the timer-driven finish() always sends the latest transcript.
  const transcriptsRef = useRef<Transcripts>(EMPTY);
  const elapsedRef = useRef(0);
  /** The server-side session. Its start time is the real clock; this page's timer only displays it. */
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const elapsed = c.partSeconds - remaining;
  const agentInfo = c.agents.find((a) => a.id === agent) ?? c.agents[0];

  const updateTranscripts = useCallback((fn: (t: Transcripts) => Transcripts) => {
    transcriptsRef.current = fn(transcriptsRef.current);
    setTranscripts(transcriptsRef.current);
  }, []);

  /** The opening line is scripted: shown straight from the case, no model call. */
  const openAgent = useCallback(
    (id: AgentId) => {
      setAgent(id);
      const info = c.agents.find((a) => a.id === id);
      stopVoice();
      if (info?.openingLine && transcriptsRef.current[id].length === 0) {
        const line = info.openingLine;
        updateTranscripts((t) => ({ ...t, [id]: [{ role: "actor", text: line, t: elapsedRef.current }] }));
        if (voice && sessionIdRef.current) void playVoice(sessionIdRef.current, id);
      }
      inputRef.current?.focus();
    },
    [c.agents, updateTranscripts, voice, playVoice, stopVoice],
  );

  async function start() {
    if (starting) return;
    // Inside the click, so the browser lets the characters speak later.
    if (voice) unlockVoice();
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
      setPhase("live");
      openAgent("patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the session");
    } finally {
      setStarting(false);
    }
  }

  const finish = useCallback(async () => {
    abortRef.current?.abort();
    stopVoice();
    setStreaming(false);
    setPhase("grading");
    setError(null);
    try {
      const res = await fetch("/api/session/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Grading failed (${res.status})`);
      setDebrief(data as Debrief);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
    }
  }, [stopVoice]);

  // The orchestrator, not a model, owns the clock and ends the part.
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

  function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    void say(text);
  }

  /** Sends one thing the candidate said (typed or transcribed) and plays the reply. */
  async function say(text: string) {
    if (streaming || phase !== "live") return;
    setError(null);
    stopVoice();

    const id = agent;
    const transcript: Turn[] = [...transcriptsRef.current[id], { role: "candidate", text, t: elapsedRef.current }];
    updateTranscripts((t) => ({ ...t, [id]: transcript }));

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    try {
      const res = await fetch("/api/session/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, agent: id, text }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        // The server's clock ran out first: close the part the same way the timer would.
        if (res.status === 409 && data.ended) {
          void finish();
          return;
        }
        throw new Error(data.error ?? `The actor didn't respond (${res.status})`);
      }
      // Keep the display timer in step with the server clock.
      const serverElapsed = Number(res.headers.get("X-Elapsed"));
      if (Number.isFinite(serverElapsed) && serverElapsed > elapsedRef.current) {
        elapsedRef.current = serverElapsed;
        setRemaining(Math.max(0, c.partSeconds - serverElapsed));
      }
      const replyAt = elapsedRef.current;
      updateTranscripts((t) => ({ ...t, [id]: [...t[id], { role: "actor", text: "", t: replyAt }] }));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const soFar = reply;
        updateTranscripts((t) => ({ ...t, [id]: [...t[id].slice(0, -1), { role: "actor", text: soFar, t: replyAt }] }));
      }
      // The reply is saved before the stream closes, so the server can voice it now.
      if (voice && reply.trim() && sessionIdRef.current) void playVoice(sessionIdRef.current, id);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function holdStart() {
    if (streaming || transcribing || phase !== "live" || recorder.recording) return;
    holdingRef.current = true;
    unlockVoice();
    stopVoice();
    setError(null);
    try {
      await recorder.start();
      // Let go while the browser was still asking for the mic: discard this take.
      if (!holdingRef.current) await recorder.stop();
    } catch (err) {
      setError(
        (err as MicError) === "blocked"
          ? "Pharmify can't use your microphone. Allow it in your browser, or type instead."
          : "This browser can't record audio. Type instead.",
      );
      setTyping(true);
    }
  }

  async function holdEnd() {
    holdingRef.current = false;
    const take = await recorder.stop();
    if (!take) return;
    if (take.ms < 400) {
      setError("Hold the button down while you talk, then let go.");
      return;
    }
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("sessionId", sessionIdRef.current ?? "");
      form.append("audio", take.audio);
      const res = await fetch("/api/session/listen", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.ended) return void finish();
      if (!res.ok) throw new Error(data.error ?? `Couldn't hear that (${res.status})`);
      const text = String(data.text ?? "").trim();
      if (!text) throw new Error("Didn't catch that. Try again, a little closer to the mic.");
      setTranscribing(false);
      await say(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't hear that");
    } finally {
      setTranscribing(false);
    }
  }

  function replay() {
    sessionIdRef.current = null;
    transcriptsRef.current = EMPTY;
    elapsedRef.current = 0;
    setTranscripts(EMPTY);
    setRemaining(c.partSeconds);
    setDebrief(null);
    setError(null);
    setAgent("patient");
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

  const thread = transcripts[agent];
  const lastActor = [...thread].reverse().find((t) => t.role === "actor");
  const lastCandidate = [...thread].reverse().find((t) => t.role === "candidate");
  const waiting = streaming && thread.at(-1)?.role === "candidate";
  // With voice, the character "talks" while the audio plays; without it, while the text streams in.
  const talking = voice ? speaking : streaming && !waiting;
  const status = transcribing
    ? "Listening back…"
    : waiting || (voice && streaming)
      ? `${agentInfo.name} is thinking…`
      : talking
        ? `${agentInfo.name} is speaking`
        : "";

  return (
    <div className="flex min-h-screen flex-col bg-white text-base leading-normal">
      <SessionHeader c={c} phase={phase} remaining={remaining} elapsed={elapsed} notice={timeCheck(remaining, c.partSeconds)} />

      <main className="flex flex-1 flex-wrap items-stretch">
        <CaseDocuments c={c} />

        {/* Stage */}
        <section aria-label="Role play" className="flex min-w-0 flex-[999_1_560px] flex-col">
          {phase === "ready" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
              <Pip mood="exam" size={110} />
              <h1 className="m-0 text-[clamp(26px,2.6vw,34px)] font-bold tracking-[-0.02em]">
                Read the question sheet, then start.
              </h1>
              <p className="m-0 max-w-[46ch] text-muted">
                You&apos;ll have 20 minutes. {c.agents[1] ? `Use “${c.agents[1].label}” to talk to them at any time. ` : ""}
                The examiner stays neutral and only gives time checks.{" "}
                {voice
                  ? "Hold the button and speak as you would in the room. Turn your sound on."
                  : "Type what you would say out loud."}
              </p>
              <button
                type="button"
                onClick={() => void start()}
                disabled={starting}
                className="min-h-[60px] cursor-pointer rounded-[18px] border-2 border-ink bg-sun px-9 text-[19px] font-bold text-ink shadow-pop-md disabled:cursor-wait disabled:opacity-70"
              >
                {starting ? "Starting…" : "Start the clock"}
              </button>
              {error && (
                <p role="alert" className="m-0 font-semibold text-alert">
                  {error}
                </p>
              )}
            </div>
          )}

          {phase === "grading" && <GradingPanel error={error} onRetry={() => void finish()} />}

          {phase === "live" && (
            <>
              {c.agents.length > 1 && (
                <div className="flex justify-center px-6 pt-5">
                  <div role="group" aria-label="Who you are speaking with" className="inline-flex gap-1 rounded-xl bg-chip p-1">
                    {c.agents.map((a) => {
                      const on = agent === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={on}
                          disabled={streaming}
                          onClick={() => openAgent(a.id)}
                          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-4 text-sm font-medium disabled:cursor-not-allowed ${
                            on ? "bg-white text-ink shadow-[0_1px_2px_rgba(22,17,42,0.12)]" : "bg-transparent text-ink-2"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <CastAvatar id={a.avatar} size={26} decorative className="-my-1" />
                            {a.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Orb and latest line */}
              <div className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-8 text-center">
                <SpeakerAvatar
                  avatar={agentInfo.avatar}
                  name={agentInfo.name}
                  talking={talking}
                  level={voice ? voiceLevel : undefined}
                />
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm text-subtle">
                    {status}
                  </span>
                  <p
                    aria-live="polite"
                    className="m-0 min-h-[1.35em] max-w-[34ch] text-[clamp(22px,2.4vw,30px)] leading-[1.35] tracking-[-0.02em] text-balance"
                  >
                    {lastActor ? `“${lastActor.text}”` : ""}
                  </p>
                </div>
                {lastCandidate && <p className="m-0 max-w-[60ch] text-sm text-subtle">You said: “{lastCandidate.text}”</p>}
                {error && <p className="m-0 text-sm font-semibold text-alert">{error}</p>}
                {showTranscript && (
                  <div className="flex max-h-[260px] w-full max-w-[600px] flex-col gap-1.5 overflow-y-auto rounded-2xl bg-canvas p-4 text-left text-sm">
                    <p className="m-0 mb-1 font-semibold">Transcript · {agentInfo.label}</p>
                    {thread.map((t, idx) => (
                      <p key={idx} className="m-0 text-muted">
                        <span className="font-mono text-xs text-subtle">{clock(t.t)}</span>{" "}
                        <b className="text-ink">{t.role === "candidate" ? "You" : agentInfo.name}:</b> {t.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Control dock */}
              <div className="flex justify-center px-6 pb-8">
                <form
                  onSubmit={send}
                  className="flex w-full max-w-[760px] flex-wrap items-center gap-2.5 rounded-[28px] border-[1.5px] border-line bg-white p-2.5 shadow-card"
                >
                  {voice && (
                    <button
                      type="button"
                      aria-label={typing ? "Speak instead" : "Type instead"}
                      title={typing ? "Speak instead" : "Type instead"}
                      onClick={() => setTyping(!typing)}
                      className={`${roundBtn} bg-chip`}
                    >
                      {typing ? <MicIcon /> : <KeyboardIcon />}
                    </button>
                  )}
                  {typing ? (
                    <>
                      <label htmlFor="say" className="sr-only">
                        What you say to {agentInfo.name}
                      </label>
                      <input
                        id="say"
                        ref={inputRef}
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoComplete="off"
                        placeholder={`Say something to ${agentInfo.name}…`}
                        className="min-h-[52px] min-w-0 flex-[1_1_260px] rounded-full bg-chip px-5 text-base text-ink outline-none focus:ring-2 focus:ring-pink"
                      />
                      <button
                        type="submit"
                        disabled={streaming || !input.trim()}
                        className="min-h-[52px] cursor-pointer rounded-full border-2 border-ink bg-sun px-6 text-base font-bold text-ink shadow-pop disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Say it
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={streaming || transcribing}
                      aria-pressed={recorder.recording}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        void holdStart();
                      }}
                      onPointerUp={() => void holdEnd()}
                      onPointerCancel={() => void holdEnd()}
                      onKeyDown={(e) => {
                        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                          e.preventDefault();
                          void holdStart();
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === " " || e.key === "Enter") void holdEnd();
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`inline-flex min-h-[60px] flex-[1_1_220px] cursor-pointer touch-none items-center justify-center gap-2.5 rounded-full border-2 border-ink px-7 text-[17px] font-bold text-ink shadow-pop select-none disabled:cursor-not-allowed disabled:opacity-60 ${
                        recorder.recording ? "translate-y-[2px] bg-pink-tint shadow-none" : "bg-sun"
                      }`}
                    >
                      <MicIcon filled />
                      {recorder.recording ? "Listening… let go to send" : transcribing ? "Working it out…" : "Hold to speak"}
                    </button>
                  )}
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
                  <button
                    type="button"
                    onClick={() => void finish()}
                    className="inline-flex min-h-[52px] cursor-pointer items-center rounded-full border-0 bg-alert-tint px-5 font-semibold text-alert"
                  >
                    Finish part
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function MicIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="6" height="10" rx="3" {...(filled ? { fill: "#16112A" } : { stroke: "#16112A", strokeWidth: 1.6 })} />
      <path d="M4 9.5a6 6 0 0012 0M10 15.5v2.5" stroke="#16112A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="16" height="10" rx="2" stroke="#16112A" strokeWidth="1.6" />
      <path d="M5 8.5h1M8 8.5h1M11 8.5h1M14 8.5h1M6 11.5h8" stroke="#16112A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The character the candidate is talking to. Patients stand at the pharmacy counter
 * (design: "Voice session"); prescribers are on the phone, so they stay in a circle with
 * a halo that pulses while they talk. Either way the head bobs and the mouth moves while
 * the reply comes in. Decorative apart from the name tag; the reply text carries the meaning.
 */
function SpeakerAvatar({
  avatar,
  name,
  talking,
  level,
}: {
  avatar: CastId;
  name: string;
  talking: boolean;
  /** Loudness of the voice, 0–1, when audio is playing; the mouth follows it. */
  level?: () => number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useTalkingMouth(ref, { talking, level });
  const bob = talking ? "cast-bob" : "";
  const tag = (
    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px] border-line-soft bg-white px-3 py-1 text-[13px] font-bold whitespace-nowrap">
      {name}
    </span>
  );

  if (CAST[avatar].kind === "patient") {
    return (
      <div ref={ref} className="relative w-full max-w-[680px]">
        <div className="overflow-hidden rounded-[28px] border-[3px] border-white shadow-[0_20px_40px_-24px_rgba(22,17,42,0.45),0_0_0_1.5px_#E5E1EC]">
          <PharmacyScene className="block">
            <g className={bob}>
              <CastAvatar key={avatar} id={avatar} size={216} decorative />
            </g>
          </PharmacyScene>
        </div>
        {tag}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative grid size-[200px] place-items-center">
      {talking && (
        <>
          <span aria-hidden="true" className="absolute inset-4 animate-ring rounded-full bg-pink opacity-25" />
          <span aria-hidden="true" className="absolute inset-4 animate-ring-late rounded-full bg-pink opacity-25" />
        </>
      )}
      <span aria-hidden="true" className="absolute inset-4 rounded-full bg-pink opacity-10" />
      <span
        aria-hidden="true"
        className="relative grid size-[152px] place-items-end justify-center overflow-hidden rounded-full border-[3px] border-white bg-pink-tint shadow-[0_24px_48px_-20px_rgba(230,80,150,0.45)]"
      >
        <span className={`block translate-y-1.5 ${bob}`}>
          <CastAvatar key={avatar} id={avatar} size={150} decorative className="block" />
        </span>
      </span>
      {tag}
    </div>
  );
}
