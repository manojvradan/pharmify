"use client";

import { type RemoteTrack, Room, RoomEvent, Track } from "livekit-client";

/** How long to wait for the voice agent to join before giving up (LiveKit Cloud cold starts take up to ~20 s). */
const AGENT_JOIN_TIMEOUT_MS = 25_000;
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/cases/schema";
import { TOPIC_ENDED, TOPIC_SWITCH } from "@/lib/voice/agentTicket.shared";
import { closeAudioContext, resumeAudioContext } from "@/lib/voice/audioContext";

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
export function useLiveKitVoice({
  onLine,
  onEnded,
  onLost,
}: {
  onLine: (line: LiveLine) => void;
  onEnded: () => void;
  /** The room dropped or the agent left mid-session (not a `disconnect()` call). */
  onLost: () => void;
}) {
  const roomRef = useRef<Room | null>(null);
  const audioElRef = useRef<HTMLMediaElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const [state, setState] = useState<AgentState | "off">("off");
  // Kept in refs so the room's handlers always call the latest callbacks.
  const onLineRef = useRef(onLine);
  const onEndedRef = useRef(onEnded);
  const onLostRef = useRef(onLost);
  useEffect(() => {
    onLineRef.current = onLine;
    onEndedRef.current = onEnded;
    onLostRef.current = onLost;
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
      if (ctxRef.current?.state === "closed") ctxRef.current = null;
      if (!ctxRef.current && typeof AudioContext !== "undefined") ctxRef.current = new AudioContext();
      resumeAudioContext(ctxRef.current);
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
      // Only a drop we didn't ask for: disconnect() clears roomRef first.
      const lost = () => {
        if (roomRef.current !== room) return;
        disconnect();
        onLostRef.current();
      };
      room.on(RoomEvent.Disconnected, lost);
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        if (p.isAgent && agentInRoom) lost();
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

      // Resolves when the agent is in the room; rejects if it never comes (e.g. no agent worker running).
      let agentInRoom = false;
      const agentJoined = new Promise<void>((resolve, reject) => {
        const isIn = () => [...room.remoteParticipants.values()].some((p) => p.isAgent);
        const timer = setTimeout(() => {
          room.off(RoomEvent.ParticipantConnected, check);
          reject(new Error("The voice agent didn't join"));
        }, AGENT_JOIN_TIMEOUT_MS);
        function check() {
          if (!isIn()) return;
          agentInRoom = true;
          clearTimeout(timer);
          room.off(RoomEvent.ParticipantConnected, check);
          resolve();
        }
        room.on(RoomEvent.ParticipantConnected, check);
        room.once(RoomEvent.Connected, check);
      });

      await room.connect(data.url, data.token);
      try {
        await agentJoined;
      } catch (err) {
        disconnect();
        throw err;
      }
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
      closeAudioContext(ctxRef.current);
      ctxRef.current = null;
    },
    [disconnect],
  );

  return { connect, disconnect, switchTo, level, state };
}
