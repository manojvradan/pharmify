/**
 * Closes an AudioContext once. Closing an already-closed context rejects with
 * InvalidStateError, which happens when cleanups run twice (Strict Mode, Fast Refresh,
 * or a stop followed by unmount).
 */
export function closeAudioContext(ctx: AudioContext | null | undefined): void {
  if (!ctx || ctx.state === "closed") return;
  ctx.close().catch(() => {});
}

/** Resumes an AudioContext unless it's missing or closed (resuming a closed one rejects). */
export function resumeAudioContext(ctx: AudioContext | null | undefined): void {
  if (!ctx || ctx.state === "closed") return;
  ctx.resume().catch(() => {});
}
