"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { DebriefReport } from "@/components/DebriefReport";
import { Pip } from "@/components/Pip";
import { PipGrading } from "@/components/PipGrading";
import { LogoMark } from "@/components/icons";
import { useTalkingMouth } from "@/hooks/useTalkingMouth";
import type { AgentId, PublicCase, Turn } from "@/lib/cases/schema";
import type { CastId } from "@/lib/cast";
import type { Debrief } from "@/lib/session/report";

const PART_SECONDS = 20 * 60;
/** The examiner's only interjections: neutral time checks. */
function timeCheck(remaining: number) {
  if (remaining <= 60) return "One minute remaining.";
  if (remaining <= 300) return "Five minutes remaining.";
  return null;
}

type Phase = "ready" | "live" | "grading" | "review";
type Transcripts = Record<AgentId, Turn[]>;

const EMPTY: Transcripts = { patient: [], prescriber: [] };

function clock(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const docLabel = "m-0 text-xs font-medium tracking-[0.05em] text-subtle uppercase";
const roundBtn = "grid size-[52px] cursor-pointer place-items-center rounded-full border-0";
const CATEGORY_LABEL = { ethical: "Ethical", legal: "Legal", clinical: "Complex clinical" } as const;

export function ExamSession({ case: c }: { case: PublicCase }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [remaining, setRemaining] = useState(PART_SECONDS);
  const [agent, setAgent] = useState<AgentId>("patient");
  const [transcripts, setTranscripts] = useState<Transcripts>(EMPTY);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [starting, setStarting] = useState(false);

  // Refs mirror state so the timer-driven finish() always sends the latest transcript.
  const transcriptsRef = useRef<Transcripts>(EMPTY);
  const elapsedRef = useRef(0);
  /** The server-side session. Its start time is the real clock; this page's timer only displays it. */
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const elapsed = PART_SECONDS - remaining;
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
      if (info?.openingLine && transcriptsRef.current[id].length === 0) {
        const line = info.openingLine;
        updateTranscripts((t) => ({ ...t, [id]: [{ role: "actor", text: line, t: elapsedRef.current }] }));
      }
      inputRef.current?.focus();
    },
    [c.agents, updateTranscripts],
  );

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
  }, []);

  // The orchestrator, not a model, owns the clock and ends the part.
  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => {
      const next = Math.max(0, PART_SECONDS - elapsedRef.current - 1);
      elapsedRef.current = PART_SECONDS - next;
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        void finish();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming || phase !== "live") return;
    setInput("");
    setError(null);

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
        setRemaining(Math.max(0, PART_SECONDS - serverElapsed));
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
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function replay() {
    sessionIdRef.current = null;
    transcriptsRef.current = EMPTY;
    elapsedRef.current = 0;
    setTranscripts(EMPTY);
    setRemaining(PART_SECONDS);
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-base leading-normal">
      <SessionHeader c={c} phase={phase} remaining={remaining} elapsed={elapsed} notice={timeCheck(remaining)} />

      <main className="flex flex-1 flex-wrap items-stretch">
        {/* Case documents */}
        <aside
          aria-label="Case documents"
          className="flex max-w-[400px] flex-[1_1_340px] flex-col gap-5 border-r border-line-soft bg-canvas p-6"
        >
          <div className="flex flex-col gap-2">
            <h2 className={docLabel}>Question sheet</h2>
            <p className="m-0 text-[15px]">{c.questionSheet}</p>
          </div>
          {c.documents.prescription && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4">
              <h2 className={docLabel}>Prescription</h2>
              <span className="font-semibold">{c.documents.prescription.item}</span>
              <span className="text-sm text-subtle">{c.documents.prescription.directions}</span>
              <span className="border-t border-line-soft pt-2 text-[13px] text-subtle">{c.documents.prescription.footer}</span>
            </div>
          )}
          {c.documents.dispensingHistory && c.documents.dispensingHistory.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <h2 className={docLabel}>Dispensing history</h2>
              {c.documents.dispensingHistory.map((d, idx, all) => (
                <div
                  key={`${d.item}-${d.date}`}
                  className={`flex justify-between gap-3 py-2 text-sm ${idx < all.length - 1 ? "border-b border-line-soft" : ""}`}
                >
                  <span>{d.item}</span>
                  <span className="font-mono text-subtle">{d.date}</span>
                </div>
              ))}
            </div>
          )}
          {c.documents.notes && c.documents.notes.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <h2 className={docLabel}>Notes</h2>
              {c.documents.notes.map((n) => (
                <p key={n} className="m-0 text-sm">{n}</p>
              ))}
            </div>
          )}
          <p className="m-0 text-[13px] text-subtle">Open book: keep your own references beside you.</p>
          {c.draft && (
            <p className="m-0 rounded-xl bg-sun-tint px-3 py-2 text-[13px] text-sun-deep">
              Draft case: not yet reviewed by a pharmacist.
            </p>
          )}
        </aside>

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
                The examiner stays neutral and only gives time checks. Type what you would say out loud.
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

          {phase === "grading" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
              {error ? (
                <>
                  <Pip mood="thinking" size={110} />
                  <p className="m-0 font-semibold text-alert">{error}</p>
                  <button
                    type="button"
                    onClick={() => void finish()}
                    className="min-h-[52px] cursor-pointer rounded-2xl border-2 border-ink bg-sun px-6 font-bold text-ink shadow-pop"
                  >
                    Try marking again
                  </button>
                </>
              ) : (
                <>
                  <PipGrading />
                  <h1 role="status" className="m-0 text-[clamp(24px,2.4vw,30px)] font-bold tracking-[-0.02em]">
                    Time&apos;s up. Pip is marking your session…
                  </h1>
                  <p className="m-0 max-w-[44ch] text-muted">
                    An independent grader is reading your transcript against the Board&apos;s criteria. This takes a moment.
                  </p>
                </>
              )}
            </div>
          )}

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
                <SpeakerAvatar avatar={agentInfo.avatar} talking={streaming && !waiting} />
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm text-subtle">
                    {waiting ? `${agentInfo.name} is thinking…` : streaming ? `${agentInfo.name} is speaking` : agentInfo.name}
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

function SessionHeader({
  c,
  phase,
  remaining,
  elapsed,
  notice,
}: {
  c: PublicCase;
  phase: Phase;
  remaining: number;
  elapsed: number;
  notice: string | null;
}) {
  return (
    <header className="border-b border-line-soft bg-white">
      <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <Link href="/home" aria-label="Back to case map" className="grid size-11 place-items-center rounded-xl">
            <LogoMark size={38} />
          </Link>
          <div className="flex flex-col leading-[1.25]">
            <span className="text-lg font-semibold tracking-[-0.02em]">
              {phase === "review" ? c.title : `${CATEGORY_LABEL[c.category]} case`}
            </span>
            <span className="text-[13px] text-subtle">{c.setting}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {notice && phase === "live" && (
            <span role="status" className="rounded-full bg-sun-tint px-3.5 py-1.5 text-[13px] font-semibold text-sun-deep">
              Examiner: {notice}
            </span>
          )}
          <span className="inline-flex items-center gap-2.5 rounded-full bg-ink py-1 pr-3.5 pl-1.5 text-[13px] font-semibold text-white">
            <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-white">
              <Pip mood={phase === "review" ? "happy" : "exam"} size={30} />
            </span>
            {phase === "review" ? "Review mode · Pip's back" : "Exam mode · Pip's locked in"}
          </span>
          {phase !== "review" && (
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="block h-1 w-[120px] rounded-sm bg-line-soft">
                <span className="block h-1 rounded-sm bg-pink" style={{ width: `${(elapsed / PART_SECONDS) * 100}%` }} />
              </span>
              <span role="timer" aria-label="Time remaining" className="font-mono text-xl font-medium">
                {clock(remaining)}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * The character the candidate is talking to, in place of the old voice orb. The halo
 * pulses and the mouth moves while their reply comes in. Decorative: the name and the
 * reply text next to it carry the meaning.
 */
function SpeakerAvatar({ avatar, talking }: { avatar: CastId; talking: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useTalkingMouth(ref, { talking });
  return (
    <div ref={ref} aria-hidden="true" className="relative grid size-[200px] place-items-center">
      {talking && (
        <>
          <span className="absolute inset-4 animate-ring rounded-full bg-pink opacity-25" />
          <span className="absolute inset-4 animate-ring-late rounded-full bg-pink opacity-25" />
        </>
      )}
      <span className="absolute inset-4 rounded-full bg-pink opacity-10" />
      <span className="relative grid size-[152px] place-items-end justify-center overflow-hidden rounded-full border-[3px] border-white bg-pink-tint shadow-[0_24px_48px_-20px_rgba(230,80,150,0.45)]">
        <CastAvatar key={avatar} id={avatar} size={150} decorative className="translate-y-1.5" />
      </span>
    </div>
  );
}
