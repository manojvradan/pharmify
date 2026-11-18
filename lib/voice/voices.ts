import type { CastId } from "@/lib/cast";

/**
 * The voices characters speak in. `id` is the ElevenLabs Voice Library voice (all Australian,
 * chosen 2026-11-07), used by the app's own voice mode (hold to speak). `inworld` is the
 * Inworld TTS 2 Flash voice the hands-free agent speaks with (through LiveKit Inference, about a
 * third of the cost; chosen 2026-11-19 by name and style, so check by ear when changing one).
 * A persona can pick any of these with `voice` in its case.
 */
export const VOICE_LIBRARY = {
  "au-older-man": { id: "YrAYvOVjAFiqVwBgB4qI", inworld: "Ronald", name: "Tanksinker", note: "Australian man in his late 60s, ordinary and warm" },
  "au-quiet-man": { id: "IzFL458lJFnp5DUApI6q", inworld: "Dennis", name: "Bradley", note: "Mature Australian man, quiet and calm" },
  "au-man-30s": { id: "IKne3meq5aSn9XLyUdCD", inworld: "Mark", name: "Charlie", note: "Australian man, 25–45, confident and quick" },
  "au-man-40s": { id: "DYkrAHD8iwork3YSUBbs", inworld: "Shaun", name: "Tom", note: "Middle-aged Australian man, easygoing" },
  "au-young-man": { id: "mWNaiDAPDAx080ro4nL5", inworld: "Timothy", name: "Bailey", note: "Young Australian man, casual" },
  "au-young-man-2": { id: "sai9UY7iXkRDSsXHR0bZ", inworld: "Blake", name: "Ben", note: "Young Australian man, clear" },
  "au-woman-40s": { id: "e1nbKcfTL4XYy71tZn9J", inworld: "Ashley", name: "Kylie", note: "Australian woman, mid-30s to 40s, warm" },
  "au-soft-woman": { id: "aRlmTYIQo6Tlg5SlulGC", inworld: "Luna", name: "Charlotte", note: "Australian woman, softly spoken and gentle" },
  "au-young-woman": { id: "luVEyhT3CocLZaLBps8v", inworld: "Hana", name: "Vivian", note: "Young Australian woman of Asian background" },
  "au-woman-professional": { id: "M7ya1YbaeFaPXljg9BpK", inworld: "Elizabeth", name: "Hannah", note: "Australian woman, natural and confident" },
  "au-doctor": { id: "WLKp2jV6nrS8aMkPPDRO", inworld: "Edward", name: "Paul", note: "Australian man, articulate and warm (GPs)" },
  "au-man-professional": { id: "snyKKuaGYk1VUEh42zbW", inworld: "Liam", name: "Australian Male", note: "Australian man, crisp and professional" },
  "au-man-mid-30s": { id: "SCbIlR40EEyW2I6quW1h", inworld: "Alex", name: "Alex", note: "Australian man in his mid-30s, relaxed" },
  "au-deep-man": { id: "9B2Vd5yQ7rKaqNmzGdy1", inworld: "Hades", name: "Steve Hogan", note: "Deep, authoritative Australian man" },
} as const;

export type VoiceKey = keyof typeof VOICE_LIBRARY;
export const VOICE_KEYS = Object.keys(VOICE_LIBRARY) as [VoiceKey, ...VoiceKey[]];

/** Each cast member's usual voice; a persona overrides it with `voice` when the character plays someone else. */
export const AVATAR_VOICE: Record<CastId, VoiceKey> = {
  "bertie-walsh": "au-older-man",
  "wally-morris": "au-man-40s",
  "felix-romano": "au-man-mid-30s",
  "penny-okafor": "au-woman-40s",
  "rosie-costa": "au-soft-woman",
  "kiki-nguyen": "au-young-woman",
  "dr-holt": "au-woman-40s",
  "dr-kapoor": "au-man-professional",
  "dr-tan": "au-woman-professional",
};

/** The Inworld voice the hands-free agent uses for this slot. */
export function inworldVoice(key: VoiceKey): string {
  return VOICE_LIBRARY[key].inworld;
}

export function voiceId(key: VoiceKey): string {
  return VOICE_LIBRARY[key].id;
}
