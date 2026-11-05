"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Opus in WebM where supported (Chrome, Firefox); MP4/AAC on Safari. */
function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
}

export type MicError = "unsupported" | "blocked";

/**
 * Records one answer at a time for "hold to speak". The microphone is opened on the
 * first press and kept open for the session, so later presses start instantly.
 */
export function useRecorder() {
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [recording, setRecording] = useState(false);

  /** Starts recording. Throws a MicError if there's no microphone or permission was refused. */
  const start = useCallback(async () => {
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
  }, []);

  /** Stops and returns the recording, with how long it was held in milliseconds. */
  const stop = useCallback(async (): Promise<{ audio: Blob; ms: number } | null> => {
    const rec = recRef.current;
    recRef.current = null;
    setRecording(false);
    if (!rec || rec.state === "inactive") return null;
    const ms = performance.now() - startedAtRef.current;
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    return { audio: new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }), ms };
  }, []);

  useEffect(
    () => () => {
      if (recRef.current?.state === "recording") recRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  return { start, stop, recording };
}
