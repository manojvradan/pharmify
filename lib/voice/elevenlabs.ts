import "server-only";
import { MIC_SAMPLE_RATE, SPEECH_SAMPLE_RATE } from "./format";
import { type VoiceKey, voiceId } from "./voices";

/**
 * ElevenLabs text-to-speech and speech-to-text. Voice is optional: without
 * ELEVENLABS_API_KEY the session stays text-only and these are never called.
 */

const API = "https://api.elevenlabs.io/v1";

/** Low-latency model; replies are short, so speed matters more than the last bit of polish. */
const TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_flash_v2_5";
const STT_MODEL = process.env.ELEVENLABS_STT_MODEL ?? "scribe_v1";


export function voiceEnabled(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

function key(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

/** Streams MP3 audio of `text` in the character's voice. */
export async function speak(text: string, voice: VoiceKey, signal?: AbortSignal): Promise<Response> {
  return fetch(`${API}/text-to-speech/${voiceId(voice)}/stream?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key(), "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: TTS_MODEL, language_code: "en" }),
    signal,
  });
}

/** Transcribes one recorded answer. Returns the text, or "" if nothing was said. */
export async function transcribe(audio: Blob, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  form.append("language_code", "en");
  form.append("tag_audio_events", "false");
  form.append("file", audio, "answer.webm");
  const res = await fetch(`${API}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
    signal,
  });
  if (!res.ok) throw new Error(`ElevenLabs speech-to-text failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/**
 * A single-use token that lets the browser open one live transcription connection
 * (Scribe v2 Realtime) without seeing the API key. Expires after 15 minutes.
 */
export async function realtimeTranscriptionToken(signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${API}/single-use-token/realtime_scribe`, { method: "POST", headers: { "xi-api-key": key() }, signal });
  if (!res.ok) throw new Error(`ElevenLabs token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("ElevenLabs token response had no token");
  return data.token;
}

/** Where the browser connects for live transcription; the token goes on the end. */
export const REALTIME_STT_URL =
  `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&audio_format=pcm_${MIC_SAMPLE_RATE}` +
  "&commit_strategy=manual&language_code=en&token=";

/** A clause this long is spoken at its comma rather than waiting for the full stop. */
const LONG_CLAUSE = 70;

/**
 * Where the text can be handed to the voice: after the last finished sentence, or the last
 * comma once a clause gets long. ElevenLabs voices each piece it is sent on its own, so
 * sending a few words at a time leaves pauses between them; whole phrases sound natural.
 * Returns 0 when there is no complete phrase yet.
 */
export function phraseEnd(text: string): number {
  let end = 0;
  for (const m of text.matchAll(/[.!?…]+["'”’)\]]*\s+/g)) end = m.index + m[0].length;
  if (end) return end;
  if (text.length < LONG_CLAUSE) return 0;
  for (const m of text.matchAll(/[,;:—–]\s+/g)) end = m.index + m[0].length;
  return end;
}

export type SpeechStream = {
  /** Adds reply text as it streams from the model. */
  say: (text: string) => void;
  /** No more text: speak what is left, then finish. */
  end: () => void;
  /** PCM chunks (SPEECH_SAMPLE_RATE, 16-bit mono) as ElevenLabs produces them. Ends quietly on failure; check `failed`. */
  audio: AsyncGenerator<Buffer>;
  failed: () => boolean;
  close: () => void;
};

/**
 * Speaks text while it is still being written, over ElevenLabs' stream-input WebSocket.
 * Text goes over a phrase at a time (see phraseEnd), each with `flush`, so generation starts
 * as soon as the first sentence is complete instead of waiting for the default chunk
 * schedule. Probes from Australia on 2026-11-06: first audio about 230 ms after the first
 * sentence (about 1.2 s with the default schedule). `auto_mode` was as fast but sometimes
 * repeated words ("...might have it. Have it? I've tried..."), so it is not used.
 * Open it before the model call so the connection is ready when the words arrive.
 */
export function openSpeechStream(voice: VoiceKey): SpeechStream {
  const url =
    `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId(voice)}/stream-input` +
    `?model_id=${TTS_MODEL}&output_format=pcm_${SPEECH_SAMPLE_RATE}&language_code=en&inactivity_timeout=30`;
  const ws = new WebSocket(url);
  const outbox: string[] = [];
  let pending = ""; // text after the last whitespace: sent once the word is complete
  let open = false;
  let finished = false;
  let failed = false;

  const chunks: Buffer[] = [];
  let wake: (() => void) | null = null;
  const notify = () => {
    wake?.();
    wake = null;
  };
  const send = (msg: object) => {
    const s = JSON.stringify(msg);
    if (open) ws.send(s);
    else outbox.push(s);
  };

  ws.onopen = () => {
    open = true;
    ws.send(JSON.stringify({ text: " ", "xi-api-key": key() }));
    for (const s of outbox.splice(0)) ws.send(s);
  };
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(String(e.data)) as { audio?: string | null; isFinal?: boolean; error?: string; message?: string };
      if (m.audio) chunks.push(Buffer.from(m.audio, "base64"));
      else if (m.isFinal) finished = true;
      else if (m.error || m.message) {
        console.error("[voice] stream-input error", JSON.stringify(m).slice(0, 300));
        failed = true;
        finished = true;
      }
    } catch {
      // Ignore anything that isn't JSON.
    }
    notify();
  };
  ws.onerror = () => {
    failed = true;
    finished = true;
    notify();
  };
  ws.onclose = (e) => {
    if (e.code !== 1000 && e.code !== 1005) {
      console.error("[voice] stream-input closed", e.code, e.reason.slice(0, 200));
      failed = true;
    }
    finished = true;
    notify();
  };

  async function* audio(): AsyncGenerator<Buffer> {
    for (;;) {
      if (chunks.length) {
        yield chunks.shift()!;
        continue;
      }
      if (finished) return;
      await new Promise<void>((r) => (wake = r));
    }
  }

  return {
    say(text) {
      pending += text;
      const cut = phraseEnd(pending);
      if (cut === 0) return;
      const ready = pending.slice(0, cut).replace(/\s+/g, " ");
      pending = pending.slice(cut);
      if (ready.trim()) send({ text: ready.endsWith(" ") ? ready : `${ready} `, flush: true });
    },
    end() {
      if (pending.trim()) send({ text: `${pending} ` });
      pending = "";
      send({ text: "" });
    },
    audio: audio(),
    failed: () => failed,
    close() {
      finished = true;
      notify();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    },
  };
}
