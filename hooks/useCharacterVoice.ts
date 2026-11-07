"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/cases/schema";
import { SPEECH_SAMPLE_RATE } from "@/lib/voice/format";
import { closeAudioContext, resumeAudioContext } from "@/lib/voice/audioContext";

/** Plays streamed PCM as it arrives. Call `end()` once the last chunk is in. */
export type VoiceStream = { push: (base64: string) => void; end: () => void };

/** A few milliseconds of silent WAV, played inside a click so later playback is allowed (Safari). */
function silentWav(): string {
  const bytes = new Uint8Array(46);
  const v = new DataView(bytes.buffer);
  const ascii = (at: number, s: string) => [...s].forEach((ch, i) => v.setUint8(at + i, ch.charCodeAt(0)));
  ascii(0, "RIFF");
  v.setUint32(4, 38, true);
  ascii(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, 8000, true);
  v.setUint32(28, 16000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii(36, "data");
  v.setUint32(40, 2, true);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

/**
 * Plays what the character says and reports how loud it is right now, so the avatar's
 * mouth can follow the audio. Two ways in: `stream()` plays PCM chunks from the voice turn
 * stream as they arrive (fastest), and `play()` fetches a whole line from
 * /api/session/speak (opening lines, and the fallback).
 *
 * Call `unlock()` from a click (Start, Hold to speak) before the first `play()`:
 * browsers only allow sound that follows a user gesture.
 */
export function useCharacterVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const countRef = useRef(0);
  /** Streamed chunks scheduled or playing; `streamGen` makes a stopped stream ignore late chunks. */
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const streamGenRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);

  const element = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "auto";
      a.addEventListener("playing", () => setSpeaking(true));
      for (const ev of ["ended", "pause", "error", "emptied"]) a.addEventListener(ev, () => setSpeaking(false));
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const unlock = useCallback(() => {
    if (ctxRef.current?.state === "closed") {
      // A closed context (after an unmount or Fast Refresh) can't be reused, and the old
      // element stays wired to it, so start over with both.
      ctxRef.current = null;
      analyserRef.current = null;
      audioRef.current = null;
    }
    const a = element();
    if (!ctxRef.current && typeof AudioContext !== "undefined") {
      try {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaElementSource(a).connect(analyser);
        analyser.connect(ctx.destination);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        bufRef.current = new Float32Array(analyser.fftSize);
      } catch {
        // No Web Audio: the voice still plays, and the mouth falls back to flapping.
      }
    }
    resumeAudioContext(ctxRef.current);
    if (a.paused && !a.src) {
      a.src = silentWav();
      a.play().catch(() => {});
    }
  }, [element]);

  const stop = useCallback(() => {
    streamGenRef.current++;
    for (const src of sourcesRef.current) {
      src.onended = null;
      try {
        src.stop();
      } catch {
        // Not started yet.
      }
    }
    sourcesRef.current.clear();
    setSpeaking(false);
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
  }, []);

  /**
   * Starts a streamed line. Returns null without Web Audio (or before `unlock()`), in
   * which case use `play()` once the reply is saved.
   */
  const stream = useCallback((): VoiceStream | null => {
    const ctx = ctxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || ctx.state === "closed" || !analyser) return null;
    stop();
    resumeAudioContext(ctx);
    const gen = streamGenRef.current;
    let nextAt = 0;
    let ended = false;
    let carry: number | null = null; // a byte left over when a chunk splits a sample
    const sources = sourcesRef.current;
    const settle = () => {
      if (ended && sources.size === 0 && gen === streamGenRef.current) setSpeaking(false);
    };
    return {
      push(base64) {
        if (gen !== streamGenRef.current) return;
        const raw = atob(base64);
        const start = carry === null ? 0 : 1;
        const total = raw.length + (carry === null ? 0 : 1);
        const n = total >> 1;
        if (n === 0) {
          carry = raw.length ? raw.charCodeAt(0) : carry;
          return;
        }
        const byte = (i: number) => (i === 0 && carry !== null ? carry : raw.charCodeAt(i - start));
        const buf = ctx.createBuffer(1, n, SPEECH_SAMPLE_RATE);
        const out = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
          const v = byte(2 * i) | (byte(2 * i + 1) << 8);
          out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 0x8000;
        }
        carry = total % 2 ? raw.charCodeAt(raw.length - 1) : null;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(analyser);
        // A small lead on the first chunk absorbs network jitter between chunks.
        const at = Math.max(ctx.currentTime + (nextAt === 0 ? 0.06 : 0.01), nextAt);
        src.start(at);
        nextAt = at + buf.duration;
        sources.add(src);
        src.onended = () => {
          sources.delete(src);
          settle();
        };
        setSpeaking(true);
      },
      end() {
        ended = true;
        settle();
      },
    };
  }, [stop]);

  /** Speaks the agent's latest line. Resolves when playback starts (or fails quietly). */
  const play = useCallback(
    async (sessionId: string, agent: AgentId) => {
      const a = element();
      stop();
      // The counter makes each request distinct, so the browser never replays a cached line.
      a.src = `/api/session/speak?sessionId=${sessionId}&agent=${agent}&n=${++countRef.current}`;
      try {
        await a.play();
      } catch {
        setSpeaking(false);
      }
    },
    [element, stop],
  );

  /** Loudness of the voice right now, 0–1, for the mouth. */
  const level = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    if (!analyser || !buf) return 0.5;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const x of buf) sum += x * x;
    return Math.min(1, Math.sqrt(sum / buf.length) * 7);
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      // The element is tied to this context for good, so drop it too.
      audioRef.current = null;
      closeAudioContext(ctxRef.current);
      ctxRef.current = null;
      analyserRef.current = null;
    },
    [],
  );

  /** The unlocked AudioContext, shared with live transcription so the mic works without another gesture. */
  const context = useCallback(() => (ctxRef.current?.state === "closed" ? null : ctxRef.current), []);

  return { play, stream, stop, unlock, context, speaking, level, hasLevel: () => analyserRef.current !== null };
}
