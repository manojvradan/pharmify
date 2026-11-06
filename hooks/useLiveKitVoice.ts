"use client";

import { type RemoteTrack, Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/cases/schema";
import { TOPIC_ENDED, TOPIC_SWITCH } from "@/lib/voice/agentTicket.shared";

/** One line in the live transcript, as the agent publishes it. `id` repeats while a line is still being said. */
export type LiveLine = { id: string; role: "candidate" | "actor"; text: string; final: boolean };

/** What the agent is doing, from its `lk.agent.state` attribute. */
export type AgentState = "connecting" | "listening" | "thinking" | "speaking";

/**
 * Hands-free voice: a LiveKit room with the Pharmify agent (agent/). The microphone stays
 * on; the agent hears when the candidate has finished, speaks as the current character,
 * and can be interrupted. Lines come back as transcripts for the screen; the saved
 * transcript is the server's, written by /api/session/turn as in every other mode.
 */
export function useLiveKitVoice({ onLine, onEnded }: { onLine: (line: LiveLine) => void; onEnded: () => void }) {
  const roomRef = useRef<Room | null>(null);
  const audioElRef = useRef<HTMLMediaElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const [state, setState] = useState<AgentState | "off">("off");
  // Kept in refs so the room's handlers always call the latest callbacks.
  const onLineRef = useRef(onLine);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onLineRef.current = onLine;
    onEndedRef.current = onEnded;
  });

  const disconnect = useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    void room?.disconnect();
    audioElRef.current?.remove();
    audioElRef.current = null;
    analyserRef.current = null;
    setState("off");
  }, []);

  /**
   * Joins the session's room. Call from a click: it creates the AudioContext for the
   * mouth, and browsers only allow audio after a gesture.
   */
  const connect = useCallback(
    async (sessionId: string) => {
      if (roomRef.current) return;
      if (!ctxRef.current && typeof AudioContext !== "undefined") ctxRef.current = new AudioContext();
      void ctxRef.current?.resume();
      setState("connecting");

      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("off");
        throw new Error(data.error ?? `Couldn't start hands-free voice (${res.status})`);
      }

      const room = new Room();
      roomRef.current = room;
      // For debugging in the browser console during development only.
      if (process.env.NODE_ENV === "development") (window as unknown as { __pharmifyRoom?: Room }).__pharmifyRoom = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind !== Track.Kind.Audio) return;
        audioElRef.current?.remove();
        const el = track.attach();
        el.style.display = "none";
        document.body.appendChild(el);
        audioElRef.current = el;
        const ctx = ctxRef.current;
        if (ctx && track.mediaStreamTrack) {
          // A tap for the mouth only; the <audio> element does the playing.
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack])).connect(analyser);
          analyserRef.current = analyser;
          bufRef.current = new Float32Array(analyser.fftSize);
        }
      });
      room.on(RoomEvent.ParticipantAttributesChanged, (changed) => {
        const s = changed["lk.agent.state"];
        if (s === "listening" || s === "thinking" || s === "speaking") setState(s);
      });
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) disconnect();
      });

      room.registerTextStreamHandler("lk.transcription", async (reader, from) => {
        const attrs = reader.info.attributes ?? {};
        const trackId = attrs["lk.transcribed_track_id"];
        const mine =
          from.identity === room.localParticipant.identity ||
          (trackId !== undefined && [...room.localParticipant.trackPublications.keys()].includes(trackId));
        const id = attrs["lk.segment_id"] ?? reader.info.id;
        let text = "";
        try {
          for await (const chunk of reader) {
            text += chunk;
            onLineRef.current({ id, role: mine ? "candidate" : "actor", text, final: false });
          }
        } catch {
          // The stream was cut short (reconnect or interruption): keep what arrived.
        }
        onLineRef.current({ id, role: mine ? "candidate" : "actor", text, final: true });
      });
      room.registerTextStreamHandler(TOPIC_ENDED, async () => onEndedRef.current());

      await room.connect(data.url, data.token);
      await room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    },
    [disconnect],
  );

  /** Tells the agent who the candidate has turned to. */
  const switchTo = useCallback((agent: AgentId) => {
    void roomRef.current?.localParticipant.sendText(agent, { topic: TOPIC_SWITCH });
  }, []);

  /** Loudness of the character's voice right now, 0–1, for the mouth. */
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
      disconnect();
      void ctxRef.current?.close();
    },
    [disconnect],
  );

  return { connect, disconnect, switchTo, level, state };
}
