"use client";

import { useEffect, useState } from "react";
import { Pip } from "@/components/Pip";

/** What the grader is doing, cycled under Pip. Order follows the real grading pass. */
const STEPS = [
  "Reading your transcript",
  "Checking the four fail conditions",
  "Finding your key moments",
  "Ticking off your counselling",
  "Writing your feedback",
];

/** Rows on the exam sheet, in sheet units. The pencil and ticks follow these. */
const ROWS = [34, 52, 70, 88];

/**
 * Loading state while the grader marks the session: Pip, locked in, marks an exam
 * sheet line by line. Pure CSS animation (see `.grading-*` in globals.css); with
 * reduced motion it shows a finished, fully ticked sheet and a fixed caption.
 */
export function PipGrading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[176px] w-[230px]" aria-hidden="true">
        <div className="grading-nod absolute top-0 left-0">
          <Pip mood="exam" size={132} />
        </div>

        {/* The exam sheet Pip is marking, held up in front. */}
        <svg
          viewBox="0 0 90 108"
          width="112"
          height="134"
          className="absolute right-0 bottom-0 rotate-[6deg] drop-shadow-[0_4px_0_#16112A]"
          fill="none"
        >
          <rect x="2" y="2" width="86" height="104" rx="8" fill="#FFFFFF" stroke="#16112A" strokeWidth="2.5" />
          {/* Clip at the top */}
          <rect x="32" y="-2" width="26" height="10" rx="3" fill="#FFD84D" stroke="#16112A" strokeWidth="2.5" />
          {/* Header line: candidate name */}
          <path d="M14 18 H44" stroke="#16112A" strokeWidth="3" strokeLinecap="round" />

          {ROWS.map((y, i) => (
            <g key={y}>
              <path d={`M14 ${y} H52`} stroke="#DCD8E4" strokeWidth="3.5" strokeLinecap="round" />
              <path
                d={`M61 ${y - 1} l4 4.5 l9 -10`}
                pathLength={1}
                className={`grading-tick grading-tick-${i}`}
                stroke="#EC6F9E"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Pencil, drawn with its tip at (0, 0) and moved by CSS. */}
          <g className="grading-pencil">
            <g transform="rotate(-35)">
              <path d="M0 0 L-3 -8 H3 Z" fill="#F7D2A8" stroke="#16112A" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M-0.9 -2.6 L0 0 L0.9 -2.6 Z" fill="#16112A" />
              <rect x="-3" y="-30" width="6" height="22" fill="#FFD84D" stroke="#16112A" strokeWidth="1.8" />
              <rect x="-3" y="-35" width="6" height="5" rx="1.5" fill="#EC6F9E" stroke="#16112A" strokeWidth="1.8" />
            </g>
          </g>
        </svg>
      </div>

      <p className="m-0 flex min-h-6 items-center gap-1 text-[15px] font-semibold text-ink-2" aria-hidden="true">
        <span key={step} className="grading-caption">
          {STEPS[step]}
        </span>
        <span className="grading-dots inline-flex gap-[3px] pl-0.5">
          <span className="size-1 rounded-full bg-ink-2" />
          <span className="size-1 rounded-full bg-ink-2" />
          <span className="size-1 rounded-full bg-ink-2" />
        </span>
      </p>
    </div>
  );
}
