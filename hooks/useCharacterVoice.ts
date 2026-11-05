"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/cases/schema";

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
 * Plays what the character says, using /api/session/speak, and reports how loud it is
 * right now so the avatar's mouth can follow the audio.
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
    void ctxRef.current?.resume();
    if (a.paused && !a.src) {
      a.src = silentWav();
      a.play().catch(() => {});
    }
  }, [element]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
  }, []);

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
      void ctxRef.current?.close();
    },
    [],
  );

  return { play, stop, unlock, speaking, level, hasLevel: () => analyserRef.current !== null };
}
