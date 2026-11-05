import "server-only";
import type { CastId } from "@/lib/cast";

/**
 * ElevenLabs text-to-speech and speech-to-text. Voice is optional: without
 * ELEVENLABS_API_KEY the session stays text-only and these are never called.
 */

const API = "https://api.elevenlabs.io/v1";

/** Low-latency model; replies are short, so speed matters more than the last bit of polish. */
const TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_flash_v2_5";
const STT_MODEL = process.env.ELEVENLABS_STT_MODEL ?? "scribe_v1";

/**
 * One voice per cast member, from ElevenLabs' default voices. Swap any of these for a
 * Voice Library voice (Australian accents are there) by pasting its voice ID.
 */
export const VOICES: Record<CastId, string> = {
  "bertie-bear": "pqHfZKP75CvOlQylNhV4", // Bill: older, warm male
  "kiki-koala": "cgSgspJ2msm6clMCkdW9", // Jessica: young female
  "wally-wombat": "IKne3meq5aSn9XLyUdCD", // Charlie: Australian male, casual
  "rosie-rabbit": "pFZP5JQG7iQjIQuC4Bku", // Lily: warm older female
  "penny-penguin": "EXAVITQu4vr4xnSDxMaL", // Sarah: soft female
  "felix-fox": "iP95p4xoKVk53GoZ742B", // Chris: friendly male
  "dr-hoot": "JBFqnCBsd6RMkjVDRZzb", // George: calm, measured male
  "dr-kip": "TX3LPaxmHKxFdv7VOQHJ", // Liam: brisk male
  "dr-tusk": "nPczCjzI2devNBz1zQrb", // Brian: deep, firm male
};

export function voiceEnabled(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

function key(): string {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

/** Streams MP3 audio of `text` in the cast member's voice. */
export async function speak(text: string, avatar: CastId, signal?: AbortSignal): Promise<Response> {
  return fetch(`${API}/text-to-speech/${VOICES[avatar]}/stream?output_format=mp3_44100_64`, {
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
