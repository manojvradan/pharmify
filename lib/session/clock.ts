/**
 * The session clock. The server's `started_at` is the only clock that counts:
 * the browser timer is a display, and every turn and grade is checked here.
 */

/** Part C: 20 minutes. */
export const PART_SECONDS = 20 * 60;
/** Slack for network delay on a turn sent in the last second. */
export const GRACE_SECONDS = 10;

export function elapsedSeconds(startedAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
}

/**
 * A candidate may still speak: inside the part, plus the grace period. `limit` is the
 * part length for this case's format (lib/cases/format.ts); Part C by default.
 */
export function canTakeTurn(elapsed: number, limit: number = PART_SECONDS, grace: number = GRACE_SECONDS): boolean {
  return elapsed <= limit + grace;
}

/** What the debrief reports as time used: never more than the part allows. */
export function timeUsedAt(elapsed: number, limit: number = PART_SECONDS): number {
  return Math.min(elapsed, limit);
}
