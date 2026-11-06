"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveTranscriber, liveTranscriptionSupported } from "@/lib/voice/liveTranscriber";

/** Opus in WebM where supported (Chrome, Firefox); MP4/AAC on Safari. */
function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
}

export type MicError = "unsupported" | "blocked";

/** Live transcription while recording: the shared AudioContext and a token URL for this take. */
export type LiveOptions = { ctx: AudioContext; url: () => Promise<string> };

/** Holds shorter than this are treated as accidental taps and not transcribed. */
export const MIN_TAKE_MS = 400;

/**
 * Records one answer at a time for "hold to speak". The microphone is opened on the
 * first press and kept open for the session, so later presses start instantly.
 *
 * With `live`, the answer is also transcribed while it is spoken (LiveTranscriber), and
 * `stop()` returns the text. The recording is kept either way: if live transcription
 * fails, `text` is null and the caller uploads `audio` instead.
 */
export function useRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const liveRef = useRef<LiveTranscriber | null>(null);
  const [recording, setRecording] = useState(false);

  /** Starts recording. Throws a MicError if there's no microphone or permission was refused. */
  const start = useCallback(async (live?: LiveOptions) => {
    if (recRef.current?.state === "recording") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw "unsupported" satisfies MicError;
    if (!streamRef.current || streamRef.current.getTracks().every((t) => t.readyState === "ended")) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        throw "blocked" satisfies MicError;
      }
    }
    const mime = pickMime();
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.start();
    recRef.current = rec;
    startedAtRef.current = performance.now();
    setRecording(true);
    if (live && liveTranscriptionSupported()) {
      const t = new LiveTranscriber(live.ctx, streamRef.current, live.url());
      liveRef.current = t;
      t.start().catch((err) => {
        console.warn("[voice] live transcription didn't start", err);
        t.cancel();
        if (liveRef.current === t) liveRef.current = null;
      });
    }
  }, []);

  /** Stops and returns the recording, with how long it was held in milliseconds. */
  const stop = useCallback(async (): Promise<{ audio: Blob; ms: number; text: string | null } | null> => {
    const rec = recRef.current;
    const live = liveRef.current;
    recRef.current = null;
    liveRef.current = null;
    setRecording(false);
    if (!rec || rec.state === "inactive") {
      live?.cancel();
      return null;
    }
    const ms = performance.now() - startedAtRef.current;
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    let text: string | null = null;
    if (live && ms >= MIN_TAKE_MS) text = await live.finish();
    else live?.cancel();
    await stopped;
    return { audio: new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }), ms, text };
  }, []);

  useEffect(
    () => () => {
      if (recRef.current?.state === "recording") recRef.current.stop();
      liveRef.current?.cancel();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { start, stop, recording };
}
