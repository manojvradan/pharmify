/**
 * Audio formats shared by the server and the browser. Character speech streams as raw
 * 16-bit mono PCM so the browser can schedule it with Web Audio as each chunk arrives;
 * the candidate's microphone goes to live transcription as 16 kHz PCM.
 */
export const SPEECH_SAMPLE_RATE = 24000;
export const MIC_SAMPLE_RATE = 16000;

/** One line of the voice turn stream (application/x-ndjson): reply text, character audio, or "voice failed, text only". */
export type TurnEvent = { t: string } | { a: string } | { voiceError: true };
