import type { CastId } from "@/lib/cast";

/**
 * The voices characters speak in: all Australian, from the ElevenLabs Voice Library
 * (accent "australian", usable on every plan), chosen 2026-11-07. To change one, swap the
 * id for another library voice; a persona can pick any of these with `voice` in its case.
 */
export const VOICE_LIBRARY = {
  "au-older-man": { id: "YrAYvOVjAFiqVwBgB4qI", name: "Tanksinker", note: "Australian man in his late 60s, ordinary and warm" },
  "au-quiet-man": { id: "IzFL458lJFnp5DUApI6q", name: "Bradley", note: "Mature Australian man, quiet and calm" },
  "au-man-30s": { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", note: "Australian man, 25–45, confident and quick" },
  "au-man-40s": { id: "DYkrAHD8iwork3YSUBbs", name: "Tom", note: "Middle-aged Australian man, easygoing" },
  "au-young-man": { id: "mWNaiDAPDAx080ro4nL5", name: "Bailey", note: "Young Australian man, casual" },
  "au-young-man-2": { id: "sai9UY7iXkRDSsXHR0bZ", name: "Ben", note: "Young Australian man, clear" },
  "au-woman-40s": { id: "e1nbKcfTL4XYy71tZn9J", name: "Kylie", note: "Australian woman, mid-30s to 40s, warm" },
  "au-soft-woman": { id: "aRlmTYIQo6Tlg5SlulGC", name: "Charlotte", note: "Australian woman, softly spoken and gentle" },
  "au-young-woman": { id: "luVEyhT3CocLZaLBps8v", name: "Vivian", note: "Young Australian woman of Asian background" },
  "au-woman-professional": { id: "M7ya1YbaeFaPXljg9BpK", name: "Hannah", note: "Australian woman, natural and confident" },
  "au-doctor": { id: "WLKp2jV6nrS8aMkPPDRO", name: "Paul", note: "Australian man, articulate and warm (GPs)" },
  "au-man-professional": { id: "snyKKuaGYk1VUEh42zbW", name: "Australian Male", note: "Australian man, crisp and professional" },
  "au-man-mid-30s": { id: "SCbIlR40EEyW2I6quW1h", name: "Alex", note: "Australian man in his mid-30s, relaxed" },
  "au-deep-man": { id: "9B2Vd5yQ7rKaqNmzGdy1", name: "Steve Hogan", note: "Deep, authoritative Australian man" },
} as const;

export type VoiceKey = keyof typeof VOICE_LIBRARY;
export const VOICE_KEYS = Object.keys(VOICE_LIBRARY) as [VoiceKey, ...VoiceKey[]];

/** Each cast member's usual voice; a persona overrides it with `voice` when the character plays someone else. */
export const AVATAR_VOICE: Record<CastId, VoiceKey> = {
  "bertie-bear": "au-older-man",
  "wally-wombat": "au-man-30s",
  "felix-fox": "au-man-40s",
  "penny-penguin": "au-woman-40s",
  "rosie-rabbit": "au-soft-woman",
  "kiki-koala": "au-young-man",
  "dr-hoot": "au-doctor",
  "dr-kip": "au-man-professional",
  "dr-tusk": "au-deep-man",
};

export function voiceId(key: VoiceKey): string {
  return VOICE_LIBRARY[key].id;
}
