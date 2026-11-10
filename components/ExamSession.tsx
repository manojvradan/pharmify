"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { DebriefReport } from "@/components/DebriefReport";
import { CaseDesk } from "@/components/CaseDesk";
import { GradingPanel, SessionHeader, clock, timeCheck, type Phase } from "@/components/SessionChrome";
import { PharmacyScene } from "@/components/PharmacyScene";
import { useCharacterVoice } from "@/hooks/useCharacterVoice";
import { type LiveLine, useLiveKitVoice } from "@/hooks/useLiveKitVoice";
import { MIN_TAKE_MS, type MicError, useRecorder } from "@/hooks/useRecorder";
import { useTalkingMouth } from "@/hooks/useTalkingMouth";
import type { AgentId, PublicCase, Turn } from "@/lib/cases/schema";
import { CAST, type CastId } from "@/lib/cast";
import type { Debrief } from "@/lib/session/report";
import type { TurnEvent } from "@/lib/voice/format";
import { prepareLiveTranscription } from "@/lib/voice/liveTranscriber";

type Transcripts = Record<AgentId, Turn[]>;

const EMPTY: Transcripts = { patient: [], prescriber: [] };


const roundBtn = "grid size-[52px] cursor-pointer place-items-center rounded-full border-0";

/**
 * `voice`: characters speak their lines (ElevenLabs) and the candidate can hold to speak
 * instead of typing. Off when the server has no ELEVENLABS_API_KEY.
 * `handsFree`: also offer hands-free voice (LiveKit agent): no button, the character hears
 * when you've finished and can be interrupted. Off unless LiveKit is configured.
 */
export function ExamSession({
  case: c,
  voice = false,
  handsFree = false,
}: {
  case: PublicCase;
  voice?: boolean;
  handsFree?: boolean;
}) {
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
  const {
    play: playVoice,
    stream: streamVoice,
    stop: stopVoice,
    unlock: unlockVoice,
    context: voiceContext,
    speaking,
    level: voiceLevel,
  } = useCharacterVoice();
  const recorder = useRecorder();
  /** Chosen on the start screen; fixed once the session is live. */
  // Hands-free is the default wherever it's available; the start screen can turn it off.
  const [handsFreeOn, setHandsFreeOn] = useState(handsFree && voice);
  /** Hands-free lines by segment id, so a line still being said updates in place. */
  const liveLinesRef = useRef(new Map<string, { agent: AgentId; index: number }>());
  const agentRef = useRef<AgentId>("patient");
  /** True once the hands-free room is joined (a ref so openAgent sees it straight away). */
  const handsFreeLiveRef = useRef(false);
  /** True while the "Hold to speak" button is held, so a release during the mic prompt still stops it. */
  const holdingRef = useRef(false);
  /** The next live-transcription token, fetched ahead so pressing "Hold to speak" connects at once. */
  const nextTokenRef = useRef<{ url: Promise<string>; at: number } | null>(null);

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

  const finishRef = useRef<() => void>(() => {});
  const onLiveLine = useCallback(
    (line: LiveLine) => {
      const text = line.text.trim();
      if (!text) return;
      const known = liveLinesRef.current.get(line.id);
      const id = known?.agent ?? agentRef.current;
      updateTranscripts((t) => {
        const thread = [...t[id]];
        if (known && thread[known.index]) {
          thread[known.index] = { ...thread[known.index], role: line.role, text };
        } else {
          liveLinesRef.current.set(line.id, { agent: id, index: thread.length });
          thread.push({ role: line.role, text, t: elapsedRef.current });
        }
        return { ...t, [id]: thread };
      });
    },
    [updateTranscripts],
  );
  // The agent says the server's clock has run out: end the part the same way the timer would.
  const live = useLiveKitVoice({
    onLine: onLiveLine,
    onEnded: () => finishRef.current(),
    // Mid-session drop: carry on with hold to speak, as when it fails to start.
    onLost: () => {
      handsFreeLiveRef.current = false;
      setHandsFreeOn(false);
      setError("Hands-free voice dropped. Using hold to speak instead.");
    },
  });

  /** The opening line is scripted: shown straight from the case, no model call. */
  const openAgent = useCallback(
    (id: AgentId) => {
      setAgent(id);
      agentRef.current = id;
      // Hands-free: the agent says the opening line itself, and it arrives as a transcript.
      if (handsFreeLiveRef.current) {
        live.switchTo(id);
        return;
      }
      const info = c.agents.find((a) => a.id === id);
      stopVoice();
      if (info?.openingLine && transcriptsRef.current[id].length === 0) {
        const line = info.openingLine;
        updateTranscripts((t) => ({ ...t, [id]: [{ role: "actor", text: line, t: elapsedRef.current }] }));
        if (voice && sessionIdRef.current) void playVoice(sessionIdRef.current, id);
      }
      inputRef.current?.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `live` methods are stable
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
      if (handsFreeOn) {
        try {
          await live.connect(data.sessionId);
          handsFreeLiveRef.current = true;
        } catch (err) {
          live.disconnect();
          // Carry on with hold to speak rather than lose the session.
          setHandsFreeOn(false);
          setError(err instanceof Error ? `${err.message}. Using hold to speak instead.` : "Hands-free voice didn't start");
        }
      }
      if (voice) {
        const ctx = voiceContext();
        if (ctx) prepareLiveTranscription(ctx);
        prefetchToken();
      }
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
    live.disconnect();
    handsFreeLiveRef.current = false;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `live` methods are stable
  }, [stopVoice]);
  useEffect(() => {
    finishRef.current = () => void finish();
  }, [finish]);

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

  function fetchToken(): Promise<string> {
    const url = fetch("/api/session/listen/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== "string") throw new Error(data.error ?? `No token (${res.status})`);
      return data.url as string;
    });
    url.catch(() => {}); // a failed prefetch just means this take is uploaded instead
    return url;
  }

  function prefetchToken() {
    nextTokenRef.current = { url: fetchToken(), at: Date.now() };
  }

  /** Tokens are single use and last 15 minutes: use the prefetched one if it's fresh, and fetch the next. */
  function takeToken(): Promise<string> {
    const next = nextTokenRef.current;
    const url = next && Date.now() - next.at < 10 * 60_000 ? next.url : fetchToken();
    prefetchToken();
    return url;
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
    // With voice, the reply's audio comes in the same stream as its text and plays as it arrives.
    const audio = voice ? streamVoice() : null;
    try {
      const res = await fetch("/api/session/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, agent: id, text, voice: Boolean(audio) }),
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
      const events = res.headers.get("Content-Type")?.startsWith("application/x-ndjson") ?? false;
      let reply = "";
      let lineBuf = "";
      let voiced = false;
      const showReply = () => {
        const soFar = reply;
        updateTranscripts((t) => ({ ...t, [id]: [...t[id].slice(0, -1), { role: "actor", text: soFar, t: replyAt }] }));
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!events) {
          reply += chunk;
          showReply();
          continue;
        }
        lineBuf += chunk;
        const lines = lineBuf.split("\n");
        lineBuf = lines.pop() ?? "";
        let textChanged = false;
        for (const line of lines) {
          if (!line) continue;
          const e = JSON.parse(line) as TurnEvent;
          if ("t" in e) {
            reply += e.t;
            textChanged = true;
          } else if ("a" in e) {
            voiced = true;
            audio?.push(e.a);
          }
        }
        if (textChanged) showReply();
      }
      audio?.end();
      // No streamed audio (no Web Audio, or the voice stream failed): the reply is saved
      // before the stream closes, so the server can voice it now.
      if (voice && !voiced && reply.trim() && sessionIdRef.current) void playVoice(sessionIdRef.current, id);
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
      const ctx = voiceContext();
      // Live transcription while they talk; the recording is the fallback.
      await recorder.start(ctx && sessionIdRef.current ? { ctx, url: takeToken } : undefined);
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
    // Set before stopping: stop() waits for the last words from live transcription.
    setTranscribing(true);
    const take = await recorder.stop();
    if (!take || take.ms < MIN_TAKE_MS) {
      setTranscribing(false);
      if (take) setError("Hold the button down while you talk, then let go.");
      return;
    }
    try {
      let text = take.text;
      if (text === null) {
        // Live transcription wasn't available for this take: upload the recording.
        const form = new FormData();
        form.append("sessionId", sessionIdRef.current ?? "");
        form.append("audio", take.audio);
        const res = await fetch("/api/session/listen", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.ended) return void finish();
        if (!res.ok) throw new Error(data.error ?? `Couldn't hear that (${res.status})`);
        text = String(data.text ?? "");
      }
      text = text.trim();
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
    liveLinesRef.current.clear();
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
  const handsFreeLive = handsFreeOn && live.state !== "off";
  const talking = handsFreeLive ? live.state === "speaking" : voice ? speaking : streaming && !waiting;
  const status = handsFreeLive
    ? {
        connecting: `Bringing ${agentInfo.name} in…`,
        listening: "Listening. Just talk.",
        thinking: `${agentInfo.name} is thinking…`,
        speaking: `${agentInfo.name} is speaking`,
      }[live.state as "connecting" | "listening" | "thinking" | "speaking"]
    : transcribing
      ? "Listening back…"
      : talking
        ? `${agentInfo.name} is speaking`
        : waiting || (voice && streaming)
          ? `${agentInfo.name} is thinking…`
          : "";

  return (
    <div className="flex min-h-screen flex-col bg-white text-base leading-normal">
      <SessionHeader c={c} phase={phase} remaining={remaining} elapsed={elapsed} notice={timeCheck(remaining, c.partSeconds)} />

      <CaseDesk
        c={c}
        live={phase !== "ready"}
        brief={
          <>
            {handsFree && voice && (
              <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-2 shadow-card">
                <input
                  type="checkbox"
                  checked={handsFreeOn}
                  onChange={(e) => setHandsFreeOn(e.target.checked)}
                  className="size-4 accent-pink-deep"
                />
                Hands-free conversation (beta)
              </label>
            )}
            <button
              type="button"
              onClick={() => void start()}
              disabled={starting}
              className="min-h-14 cursor-pointer rounded-full border-2 border-ink bg-sun px-8 text-lg font-bold text-ink shadow-pop disabled:cursor-wait disabled:opacity-70"
            >
              {starting ? "Starting…" : "Start the clock"}
            </button>
            {c.draft && (
              <span className="rounded-full bg-sun-tint px-3 py-1 text-[13px] text-sun-deep">Draft case: not yet reviewed by a pharmacist</span>
            )}
            {error && (
              <p role="alert" className="m-0 font-semibold text-alert">
                {error}
              </p>
            )}
          </>
        }
      >
          {phase === "grading" && <GradingPanel error={error} onRetry={() => void finish()} />}

          {phase === "live" && (
            <>
              {c.agents.length > 1 && (
                <div className="relative z-[9] flex animate-fade-up justify-center px-6">
                  <div role="group" aria-label="Who you are speaking with" className="inline-flex gap-1 rounded-xl border border-line bg-white p-1">
                    {c.agents.map((a) => {
                      const on = agent === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          aria-pressed={on}
                          // Not while a hold-to-speak take is still being transcribed: it belongs to this character.
                          disabled={streaming || transcribing}
                          onClick={() => openAgent(a.id)}
                          className={`min-h-10 cursor-pointer rounded-[9px] border-0 px-4 text-sm font-medium disabled:cursor-not-allowed ${
                            on ? "bg-ink text-white" : "bg-transparent text-ink-2"
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
              <div className="flex w-full max-w-[620px] flex-col items-center gap-[22px] px-6 text-center">
                {/* Keyed by who it is, so each switch replays the rise-in. */}
                <SpeakerAvatar
                  key={agent}
                  avatar={agentInfo.avatar}
                  name={agentInfo.name}
                  talking={talking}
                  level={handsFreeLive ? live.level : voice ? voiceLevel : undefined}
                />
                <div className="flex animate-fade-up-late flex-col items-center gap-2.5">
                  <span className="text-sm text-subtle">
                    {status}
                  </span>
                  <p
                    aria-live="polite"
                    className="m-0 min-h-[1.35em] max-w-[30ch] text-[clamp(20px,2.2vw,27px)] leading-[1.35] tracking-[-0.02em] text-balance"
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
              <div className="relative z-[9] flex w-full animate-fade-up-late justify-center px-6">
                <form
                  onSubmit={send}
                  className="flex w-full max-w-[760px] flex-wrap items-center gap-2.5 rounded-[28px] border-[1.5px] border-line bg-white p-2.5 shadow-card"
                >
                  {handsFreeLive ? (
                    <p className="m-0 inline-flex min-h-[60px] flex-[1_1_220px] items-center justify-center gap-2.5 rounded-full bg-pink-tint px-7 text-[17px] font-bold text-ink">
                      <MicIcon filled />
                      {live.state === "connecting" ? "Connecting your mic…" : "Mic on. Talk any time."}
                    </p>
                  ) : null}
                  {voice && !handsFreeLive && (
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
                  {handsFreeLive ? null : typing ? (
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
      </CaseDesk>
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
      <div ref={ref} className="relative w-full max-w-[620px] animate-scene-in">
        <div className="overflow-hidden rounded-[24px] border-[3px] border-white shadow-[0_20px_40px_-24px_rgba(22,17,42,0.45),0_0_0_1.5px_#E5E1EC]">
          <PharmacyScene className="block">
            <g className="animate-walk-in">
              <g className={bob}>
                <CastAvatar key={avatar} id={avatar} size={216} decorative />
              </g>
            </g>
          </PharmacyScene>
        </div>
        {tag}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative grid size-[260px] animate-scene-in place-items-center">
      {/* Rings pulse out from the call while the prescriber is talking. */}
      {talking && (
        <>
          <span aria-hidden="true" className="absolute inset-3.5 animate-ring rounded-full bg-[#9ED9B3] opacity-35" />
          <span aria-hidden="true" className="absolute inset-3.5 animate-ring-late rounded-full bg-[#9ED9B3] opacity-35" />
        </>
      )}
      <span
        aria-hidden="true"
        className="relative grid size-[232px] place-items-end justify-center overflow-hidden rounded-full border-[3px] border-white bg-[#E7F6EC] shadow-[0_20px_40px_-24px_rgba(22,17,42,0.45)]"
      >
        <span className={`-mb-1.5 block ${bob}`}>
          <CastAvatar key={avatar} id={avatar} size={226} decorative className="block" />
        </span>
      </span>
      {tag}
    </div>
  );
}
