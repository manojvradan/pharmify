"use client";

import { useEffect, type RefObject } from "react";

/**
 * Drives a cast avatar's mouth by setting `--mouth` (0–1) on `ref` every animation frame.
 *
 * - With `level`, the mouth follows it: pass a function that reads the current loudness
 *   of the reply's audio (for example RMS from a Web Audio AnalyserNode, scaled to 0–1)
 *   once speech is wired in.
 * - Without it, while `talking` the mouth flaps in syllable-like beats, so text replies
 *   look spoken.
 *
 * When talking stops the mouth eases shut. With reduced motion it stays closed.
 */
export function useTalkingMouth(
  ref: RefObject<HTMLElement | null>,
  { talking, level }: { talking: boolean; level?: () => number },
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--mouth", "0");
      return;
    }

    let mouth = Number(el.style.getPropertyValue("--mouth")) || 0;
    let target = 0;
    let nextBeat = 0;
    let frame = 0;

    const tick = (now: number) => {
      if (talking) {
        if (level) {
          target = Math.min(1, Math.max(0, level()));
        } else if (now >= nextBeat) {
          // Alternate open and nearly shut, with uneven timing, like syllables.
          const opening = target < 0.3;
          target = opening ? 0.45 + Math.random() * 0.55 : Math.random() * 0.15;
          nextBeat = now + (opening ? 90 + Math.random() * 90 : 60 + Math.random() * 70);
        }
      } else {
        target = 0;
      }
      mouth += (target - mouth) * 0.35;
      el.style.setProperty("--mouth", mouth.toFixed(3));
      if (talking || mouth > 0.01) frame = requestAnimationFrame(tick);
      else el.style.setProperty("--mouth", "0");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref, talking, level]);
}
