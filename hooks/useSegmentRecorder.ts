"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MicError } from "@/hooks/useRecorder";

/** Long enough to keep sentences whole, short enough that one failed upload loses little. */
const SEGMENT_MS = 45_000;
/** Speech is intelligible at this rate, and five minutes stays around a megabyte. */
const BITS_PER_SECOND = 32_000;

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
}

/**
 * Records a long spoken answer as a series of self-contained segments, so each can be
 * transcribed while the candidate keeps talking. A new recorder starts before the old one
 * stops, so no words fall in a gap. `level()` reads the mic loudness (0–1) for a meter.
 */
export function useSegmentRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const pendingRef = useRef<Promise<void>[]>([]);
  const [recording, setRecording] = useState(false);

  /** Starts one segment; resolves `onSegment` with its audio when it stops. */
  const startSegment = useCallback((onSegment: (audio: Blob, startedAt: number) => void, now: () => number) => {
    const stream = streamRef.current!;
    const mime = pickMime();
    const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: BITS_PER_SECOND });
    const chunks: Blob[] = [];
    const startedAt = now();
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    pendingRef.current.push(
      new Promise<void>((resolve) => {
        rec.onstop = () => {
          onSegment(new Blob(chunks, { type: rec.mimeType || "audio/webm" }), startedAt);
          resolve();
        };
      }),
    );
    rec.start();
    return rec;
  }, []);

  /**
   * Opens the mic and starts recording. `now()` returns seconds since the part started,
   * stamped on each segment. Throws a MicError if recording isn't possible.
   */
  const start = useCallback(
    async (onSegment: (audio: Blob, startedAt: number) => void, now: () => number) => {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw "unsupported" satisfies MicError;
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        throw "blocked" satisfies MicError;
      }
      try {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(streamRef.current).connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        bufRef.current = new Float32Array(analyser.fftSize);
      } catch {
        // No meter, but recording still works.
      }
      pendingRef.current = [];
      recRef.current = startSegment(onSegment, now);
      timerRef.current = setInterval(() => {
        const old = recRef.current;
        recRef.current = startSegment(onSegment, now);
        old?.stop();
      }, SEGMENT_MS);
      setRecording(true);
    },
    [startSegment],
  );

  /** Stops recording and waits until the last segment has been handed to `onSegment`. */
  const stop = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (rec && rec.state !== "inactive") rec.stop();
    await Promise.all(pendingRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    setRecording(false);
  }, []);

  /** Mic loudness right now, 0–1. */
  const level = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    if (!analyser || !buf) return 0;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const x of buf) sum += x * x;
    return Math.min(1, Math.sqrt(sum / buf.length) * 8);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recRef.current?.state === "recording") recRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    },
    [],
  );

  return { start, stop, level, recording };
}
