"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { PublicCase } from "@/lib/cases/schema";
import { DispensingHistory } from "@/components/DispensingHistory";

/**
 * The exam desk (design: "Exam mode session"). Before the clock starts, the question sheet
 * sits centred with the case papers laid out under it to read. Once it starts, the question
 * sheet docks as a band along the top and the papers slide to the edges of the desk, where
 * they can be dragged (mouse, touch, or arrow keys) out of the way of the role play in the
 * middle. The prescription has a "Read" button that brings it to the centre at full size,
 * and any paper can be minimised to a tray in the bottom corner. When the case ends
 * (`papers` false) they all clear off the desk. "Full text" on the band opens the question
 * sheet to read over the darkened screen (`onReading` tells the session to pause the
 * character meanwhile).
 */

type DocId = "rx" | "hist" | "notes";
type Pos = { x: number; y: number };

/** Each paper's natural width, and how small it sits on the desk once the clock is running. */
const DOCS: Record<DocId, { w: number; liveScale: number; tilt: number }> = {
  rx: { w: 600, liveScale: 0.62, tilt: -1.2 },
  hist: { w: 270, liveScale: 1, tilt: 1.5 },
  notes: { w: 290, liveScale: 1, tilt: -0.8 },
};
const DOC_NAME: Record<DocId, string> = { rx: "Prescription", hist: "Dispensing history", notes: "Notes" };
const BAND_H = 58;
/** The least height (on screen) a side paper is squeezed to before it may run off the desk. */
const MIN_PAPER = 140;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const label = "text-[10.5px] font-semibold tracking-[0.08em] text-subtle uppercase";
const mono = "font-mono text-sm text-ink";

function Field({ name, value, wide }: { name: string; value?: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-[3px] ${wide ? "col-span-full" : ""}`}>
      <span className={label}>{name}</span>
      <span className={value ? mono : `${mono} text-subtle`}>{value ?? "—"}</span>
    </div>
  );
}

function Box({ ticked, children }: { ticked?: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[7px] text-[13px] font-semibold">
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="12.5" height="12.5" rx="1.5" stroke="#16112A" strokeWidth="1.3" />
        {ticked && <path d="M3 3 L11 11 M11 3 L3 11" stroke="#16112A" strokeWidth="1.8" strokeLinecap="round" />}
      </svg>
      {children}
      <span className="sr-only">{ticked ? " (ticked)" : " (not ticked)"}</span>
    </span>
  );
}

/** An Australian PBS prescription form, filled from the case. */
function Prescription({ p }: { p: NonNullable<PublicCase["documents"]["prescription"]> }) {
  return (
    <article
      aria-label={`Prescription${p.patientName ? ` for ${p.patientName}` : ""}`}
      className="overflow-hidden rounded-[4px] border border-t-4 border-[#D9D3E2] border-t-brand bg-white shadow-[0_1px_0_#E5E1EC,0_28px_50px_-30px_rgba(22,17,42,0.5)]"
    >
      <div className="flex justify-between gap-5 border-b border-line px-6 pt-[18px] pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-bold tracking-[-0.01em]">{p.prescriber ?? "Prescriber"}</span>
          <span className="text-[13px] text-subtle">{p.prescriberDetail ?? p.footer}</span>
        </div>
        <div className="flex flex-col items-end gap-2.5 text-right">
          <Field name="Prescriber No." />
          <div className="flex gap-3.5">
            <Box ticked={p.pbs}>PBS</Box>
            <Box>RPBS</Box>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-x-6 gap-y-3 border-b border-line px-6 py-3.5">
        <Field name="Patient's Medicare No." />
        <Field name="Date of prescribing" value={p.date} />
        <Field name="Patient's name" value={p.patientName} />
        <Field name="Date of birth" value={p.patientDob} />
        <Field name="Address" value={p.patientAddress} wide />
      </div>
      <div className="flex gap-[18px] bg-[repeating-linear-gradient(135deg,#FFFFFF_0_9px,#FCFAFD_9px_10px)] px-6 py-[18px]">
        <span aria-hidden="true" className="font-serif text-[44px] leading-[0.9] text-brand">
          ℞
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-xl font-bold tracking-[-0.01em]">{p.item}</span>
          <span className="font-mono text-[15px]">{p.instructions}</span>
          <div className="flex flex-wrap gap-x-7 gap-y-2 pt-1">
            <Field name="Quantity" value={p.quantity} />
            <Field name="Repeats" value={p.repeats} />
          </div>
          {p.brandSubstitutionNotPermitted !== undefined && (
            <div className="pt-1.5">
              <Box ticked={p.brandSubstitutionNotPermitted}>Brand substitution not permitted</Box>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between gap-5 border-t border-dashed border-[#D9D3E2] px-6 pt-3 pb-4">
        <div className="flex flex-col gap-0.5">
          <svg width="150" height="44" viewBox="0 0 150 44" fill="none" aria-hidden="true">
            <path
              d="M6 30 C14 8 22 6 20 24 C18 38 30 34 36 20 C40 12 44 14 42 26 C41 34 50 32 56 22 C60 16 64 18 62 28 C70 18 80 14 86 22 C90 28 96 26 104 18 C110 12 118 16 116 24 C122 20 132 18 144 20"
              stroke="#6E1F35"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`block w-[190px] border-t border-ink pt-1 ${label}`}>Prescriber&apos;s signature</span>
        </div>
        <div className="box-border h-[58px] w-[190px] rounded-[4px] border border-dashed border-[#C9C2D4] px-2.5 py-1.5">
          <span className={label}>Pharmacist&apos;s use</span>
        </div>
      </div>
      <div className="flex justify-between border-t border-line bg-canvas px-6 py-1.5 font-mono text-[11px] text-subtle">
        <span>{p.pbs ? "PBS/RPBS · Original" : "Private · Original"}</span>
        <span>{p.footer}</span>
      </div>
    </article>
  );
}

/**
 * A paper with a title. When its paper is height-limited on the desk, the sheet shrinks to fit
 * and its contents scroll inside it (`data-scroll`, which also stops a drag starting there).
 */
function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col gap-1.5 rounded-lg border border-[#D9D3E2] bg-white px-4 py-3.5 shadow-[0_20px_40px_-28px_rgba(22,17,42,0.45)]">
      <span className={label}>{title}</span>
      <div
        data-scroll
        className="-mr-2 min-h-0 touch-pan-y overflow-y-auto overscroll-contain pr-2 focus-visible:outline-2 focus-visible:outline-pink"
      >
        {children}
      </div>
    </div>
  );
}

/** The visitor's reduced-motion setting, kept up to date; off on the server. */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const DragDots = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <g fill="#625C70">
      {[3, 7, 11].flatMap((y) => [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
    </g>
  </svg>
);

export function CaseDesk({
  c,
  live,
  papers = true,
  brief,
  onReading,
  readingNote,
  children,
}: {
  c: PublicCase;
  /** False before the clock starts (papers laid out to read), true once it's running. */
  live: boolean;
  /** False once the case is over (grading), so the papers clear off the desk. */
  papers?: boolean;
  /** Under the question sheet before the clock starts: the start button and options. */
  brief: ReactNode;
  /** Called with true when the candidate opens the question sheet to read, false when they close it. */
  onReading?: (reading: boolean) => void;
  /** Shown on the open question sheet, e.g. that the character is paused. */
  readingNote?: ReactNode;
  /** The role play, in the middle of the desk once the clock is running. */
  children: ReactNode;
}) {
  const { prescription, dispensingHistory, notes } = c.documents;
  const ids: DocId[] = [
    ...(prescription ? (["rx"] as const) : []),
    ...(dispensingHistory?.length ? (["hist"] as const) : []),
    ...(notes?.length ? (["notes"] as const) : []),
  ];

  const stageRef = useRef<HTMLElement>(null);
  const briefRef = useRef<HTMLElement>(null);
  const docRefs = useRef<Partial<Record<DocId, HTMLDivElement | null>>>({});
  const [size, setSize] = useState({ w: 1200, h: 800, brief: 180 });
  const [heights, setHeights] = useState<Partial<Record<DocId, number>>>({});
  const [pos, setPos] = useState<Partial<Record<DocId, Pos>>>({});
  const [top, setTop] = useState<DocId>("rx");
  const [drag, setDrag] = useState<DocId | null>(null);
  const [zoom, setZoom] = useState(false);
  /** Papers minimised to the tray, in the order they went in. */
  const [mini, setMini] = useState<DocId[]>([]);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  // A replay goes back to the brief: start the next run with every paper out and none zoomed.
  const [wasLive, setWasLive] = useState(live);
  if (live !== wasLive) {
    setWasLive(live);
    if (!live) {
      setMini([]);
      setZoom(false);
    }
  }
  /** Whether a paper is on the desk right now (always, before the clock starts). */
  const shown = (id: DocId) => !live || (papers && !mini.includes(id));
  const zoomed = zoom && shown("rx");
  const stopDrag = useRef<(() => void) | null>(null);

  // Track the desk's size and each paper's height, so the layout fits any screen.
  useLayoutEffect(() => {
    const measure = () => {
      const st = stageRef.current;
      if (!st) return;
      setSize({ w: st.clientWidth, h: st.clientHeight, brief: briefRef.current?.offsetHeight ?? 0 });
      const hs: Partial<Record<DocId, number>> = {};
      // Each paper's full height, including any of its contents scrolled out of view.
      for (const id of Object.keys(docRefs.current) as DocId[]) {
        const el = docRefs.current[id];
        const sc = el?.querySelector<HTMLElement>("[data-scroll]");
        hs[id] = (el?.offsetHeight ?? 0) + (sc ? sc.scrollHeight - sc.clientHeight : 0);
      }
      setHeights(hs);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    if (briefRef.current) ro.observe(briefRef.current);
    return () => ro.disconnect();
  }, [live]);

  // The question sheet closes if the case ends (or goes back to the brief) while it's open.
  useEffect(() => {
    if (!live || !papers) sheetRef.current?.close();
  }, [live, papers]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopDrag.current?.();
    };
  }, []);

  const liveScale = useCallback((id: DocId) => Math.min(DOCS[id].liveScale, (size.w - 32) / DOCS[id].w), [size.w]);

  const clamp = useCallback(
    (id: DocId, x: number, y: number): Pos => {
      const maxX = Math.max(8, size.w - DOCS[id].w * liveScale(id) - 8);
      const maxY = Math.max(BAND_H, size.h - 60);
      return { x: Math.max(8, Math.min(maxX, x)), y: Math.max(BAND_H, Math.min(maxY, y)) };
    },
    [size.w, size.h, liveScale],
  );

  /**
   * Where a paper sits once the clock starts, until it's first moved: the prescription on the
   * left edge, the rest stacked down the right.
   */
  const homePos = (id: DocId): Pos => {
    if (id === "rx") return { x: 24, y: BAND_H + 28 };
    return { x: Math.max(8, size.w - DOCS[id].w - 24), y: sideHome[id]?.y ?? BAND_H + 28 };
  };

  /**
   * The side papers stacked down the right edge, each with the most height (on screen) it may
   * take: its full height if that fits, otherwise what's left once the papers under it have
   * room for their own (up to MIN_PAPER each). A long paper's contents scroll inside it.
   */
  const sideHome = (() => {
    const out: Partial<Record<DocId, { y: number; cap: number }>> = {};
    const side = ids.filter((id) => id !== "rx");
    const full = (id: DocId) => (heights[id] ?? 150) * liveScale(id);
    let y = BAND_H + 28;
    side.forEach((id, i) => {
      const below = side.slice(i + 1).reduce((sum, j) => sum + Math.min(full(j), MIN_PAPER) + 20, 0);
      const cap = Math.max(MIN_PAPER, Math.min(full(id), size.h - 16 - y - below));
      out[id] = { y, cap };
      y += cap + 20;
    });
    return out;
  })();
  const at = (id: DocId) => pos[id] ?? homePos(id);

  /** Where each paper sits before the clock starts: centred under the question sheet. */
  const briefLayout = (() => {
    const out: Partial<Record<DocId, Pos & { s: number; tilt: number }>> = {};
    const top0 = size.brief + 40;
    const side = ids.filter((id) => id !== "rx");
    const rxS = Math.min(0.86, (size.w - 32) / DOCS.rx.w);
    const wide = size.w >= 1120 && ids.includes("rx") && side.length > 0;
    let bottom = top0;
    if (wide) {
      // The prescription and the side papers, centred as one group.
      const group = DOCS.rx.w * rxS + 32 + Math.max(...side.map((id) => DOCS[id].w));
      out.rx = { x: (size.w - group) / 2, y: top0, s: rxS, tilt: 0 };
      let y = top0 + 36;
      for (const id of side) {
        out[id] = { x: out.rx.x + DOCS.rx.w * rxS + 32, y, s: 1, tilt: DOCS[id].tilt };
        y += (heights[id] ?? 150) + 20;
      }
      bottom = Math.max(top0 + (heights.rx ?? 520) * rxS, y);
    } else {
      let y = top0;
      for (const id of ids) {
        const s = id === "rx" ? rxS : 1;
        out[id] = { x: (size.w - DOCS[id].w * s) / 2, y, s, tilt: id === "rx" ? 0 : DOCS[id].tilt };
        y += (heights[id] ?? 150) * s + 24;
      }
      bottom = y;
    }
    return { out, bottom };
  })();

  const down = (id: DocId) => (e: PointerEvent<HTMLDivElement>) => {
    if (!live || zoomed || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    // Inside a paper that scrolls, the pointer scrolls it; the bar along the top still drags.
    const scroller = (e.target as HTMLElement).closest<HTMLElement>("[data-scroll]");
    if (scroller && scroller.scrollHeight > scroller.clientHeight) return;
    const start = { x: e.clientX, y: e.clientY, o: at(id) };
    const move = (ev: globalThis.PointerEvent) => {
      setPos((p) => ({ ...p, [id]: clamp(id, start.o.x + ev.clientX - start.x, start.o.y + ev.clientY - start.y) }));
    };
    const up = () => {
      stopDrag.current?.();
      setDrag(null);
    };
    stopDrag.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      stopDrag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    e.preventDefault();
    setDrag(id);
    setTop(id);
  };

  const key = (id: DocId) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (!live || e.target !== e.currentTarget) return;
    const d = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
    if (d) {
      e.preventDefault();
      setTop(id);
      const o = at(id);
      setPos((p) => ({ ...p, [id]: clamp(id, o.x + d[0], o.y + d[1]) }));
    } else if (id === "rx" && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setTop("rx");
      setZoom((z) => !z);
    }
  };

  /**
   * Once the clock starts, how tall a side paper may be, so it never runs past the bottom of the
   * desk: its place in the stack (sideHome) until it's moved, then whatever room is below it.
   * Longer contents scroll inside. In the paper's own units, before its scale; undefined is no limit.
   */
  const maxHeight = (id: DocId): number | undefined => {
    if (!live || id === "rx") return undefined;
    const moved = pos[id];
    const cap = moved ? Math.max(MIN_PAPER, size.h - moved.y - 16) : (sideHome[id]?.cap ?? MIN_PAPER);
    return cap / liveScale(id);
  };

  const placement = (id: DocId) => {
    const moving = drag === id || reduced ? "none" : `left .75s ${EASE}, top .75s ${EASE}, transform .75s ${EASE}, box-shadow .3s`;
    if (!live) {
      const b = briefLayout.out[id] ?? { x: 0, y: 0, s: 1, tilt: 0 };
      return { left: b.x, top: b.y, transform: `rotate(${b.tilt}deg) scale(${b.s})`, zIndex: id === "rx" ? 5 : 4, cursor: "default", transition: moving };
    }
    if (id === "rx" && zoomed) {
      const s = Math.min(1, (size.w - 16) / DOCS.rx.w);
      return { left: Math.max(8, (size.w - DOCS.rx.w * s) / 2), top: BAND_H + 38, transform: `scale(${s})`, zIndex: 20, cursor: "default", transition: moving };
    }
    const p = at(id);
    const s = liveScale(id);
    if (!shown(id)) {
      // Minimised or cleared away: drops and fades where it sat, and can't be grabbed.
      return {
        left: p.x,
        top: p.y,
        transform: `translateY(28px) rotate(${DOCS[id].tilt}deg) scale(${s * 0.92})`,
        zIndex: 6,
        opacity: 0,
        visibility: "hidden" as const,
        pointerEvents: "none" as const,
        transition: reduced ? "none" : `opacity .3s, transform .4s ${EASE}, visibility 0s .4s`,
      };
    }
    return {
      left: p.x,
      top: p.y,
      transform: drag === id ? `rotate(0deg) scale(${s * 1.03})` : `rotate(${DOCS[id].tilt}deg) scale(${s})`,
      zIndex: top === id ? 7 : 6,
      cursor: drag === id ? "grabbing" : "grab",
      opacity: 1,
      visibility: "visible" as const,
      transition: drag === id || reduced ? "none" : `${moving}, opacity .3s`,
    };
  };

  const minimise = (id: DocId) => {
    if (id === "rx") setZoom(false);
    setMini((m) => (m.includes(id) ? m : [...m, id]));
  };
  const restore = (id: DocId) => {
    setMini((m) => m.filter((x) => x !== id));
    setTop(id);
    // Hand focus back to the paper so keyboard users land where they were.
    requestAnimationFrame(() => docRefs.current[id]?.focus());
  };

  const chromeButton = "min-h-[1.9em] cursor-pointer rounded-md border border-[#D9D3E2] bg-white px-[0.7em] text-ink";

  const chrome = (id: DocId, title: string) => {
    const big = id === "rx" && !zoomed;
    return (
      <div
        aria-hidden={!live}
        className="flex flex-none items-center justify-between gap-2 overflow-hidden font-semibold text-subtle transition-[opacity,height] duration-300"
        style={{ height: live ? (big ? 40 : 30) : 0, opacity: live ? 1 : 0, fontSize: big ? 19 : 12 }}
      >
        <span className="inline-flex items-center gap-2">
          <DragDots />
          {title}
        </span>
        {live && (
          <span className="inline-flex items-center gap-[0.4em]">
            {id === "rx" && (
              <button
                type="button"
                onClick={() => {
                  setTop("rx");
                  setZoom((z) => !z);
                }}
                aria-pressed={zoomed}
                className={chromeButton}
                style={{ font: "inherit" }}
              >
                {zoomed ? "Shrink" : "Read"}
              </button>
            )}
            <button
              type="button"
              onClick={() => minimise(id)}
              aria-label={`Minimise ${DOC_NAME[id]}`}
              title="Minimise"
              className={`${chromeButton} inline-grid place-items-center`}
              style={{ font: "inherit" }}
            >
              <svg width="0.8em" height="0.8em" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1.5 5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        )}
      </div>
    );
  };

  const doc = (id: DocId, title: string, body: ReactNode) => (
    <div
      key={id}
      ref={(el) => {
        docRefs.current[id] = el;
      }}
      role="group"
      tabIndex={live && shown(id) ? 0 : -1}
      aria-hidden={!shown(id) || undefined}
      inert={!shown(id)}
      aria-label={`${title}. ${live ? `Drag or use the arrow keys to move${id === "rx" ? "; Enter to read it full size" : ""}.` : ""}`}
      onPointerDown={down(id)}
      onKeyDown={key(id)}
      className="absolute flex origin-top-left touch-none flex-col select-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-pink"
      style={{ width: DOCS[id].w, maxHeight: maxHeight(id), ...placement(id) }}
    >
      {chrome(id, id === "rx" ? "Prescription" : "Drag")}
      {body}
    </div>
  );

  const patient = c.agents.find((a) => a.id === "patient")?.name;

  return (
    <main
      ref={stageRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-canvas bg-[radial-gradient(#E3DEEA_1px,transparent_1px)] bg-size-[22px_22px]"
      style={{ minHeight: live ? 0 : Math.max(640, briefLayout.bottom + 40) }}
    >
      {!live ? (
        <section
          ref={briefRef}
          aria-label="Question sheet"
          className="absolute top-7 left-1/2 z-[9] flex w-[min(760px,calc(100%-48px))] -translate-x-1/2 flex-col items-center gap-2 text-center"
        >
          <span className={label}>Question sheet</span>
          <p className="m-0 text-xl leading-normal tracking-[-0.01em] text-balance">{c.questionSheet}</p>
          <div className="flex flex-col items-center gap-3 pt-2.5">{brief}</div>
        </section>
      ) : (
        <>
          <section
            aria-label="Question sheet"
            className="absolute inset-x-0 top-0 z-[8] animate-band-in border-b border-line-soft bg-white/92 backdrop-blur-[6px]"
          >
            <div className="mx-auto flex max-w-[980px] items-center gap-3.5 px-6 py-2.5">
              <span className={`flex-none ${label}`}>Question sheet</span>
              <p className="m-0 min-w-0 flex-1 truncate text-[15px]">{c.questionSheet}</p>
              <button
                type="button"
                onClick={() => {
                  sheetRef.current?.showModal();
                  onReading?.(true);
                }}
                aria-haspopup="dialog"
                className="min-h-9 flex-none cursor-pointer rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink"
              >
                Full text
              </button>
            </div>
          </section>
          {/* Reading mode: the whole screen dims and blurs, the papers can't be touched, and the
              sheet drops down in large type. Esc, the button or a click outside closes it. */}
          <dialog
            ref={sheetRef}
            aria-labelledby="question-sheet-title"
            onClose={() => onReading?.(false)}
            onClick={(e) => {
              if (e.target === e.currentTarget) e.currentTarget.close();
            }}
            className="mx-auto mt-[11vh] max-h-[78vh] w-[min(780px,calc(100%-32px))] overflow-y-auto overscroll-contain rounded-[28px] border-0 bg-white p-0 text-ink shadow-[0_40px_80px_-30px_rgba(22,17,42,0.6)] backdrop:bg-ink/60 backdrop:backdrop-blur-[3px] open:animate-sheet-down backdrop:open:animate-dim-in"
          >
            <div className="flex flex-col gap-5 px-6 pt-7 pb-6 sm:px-10 sm:pt-9 sm:pb-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="question-sheet-title" className={`m-0 ${label}`}>
                  Question sheet
                </h2>
                {readingNote && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1 text-[13px] font-semibold text-ink-2">
                    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="3" height="11" rx="1" fill="currentColor" />
                      <rect x="6.5" y="0.5" width="3" height="11" rx="1" fill="currentColor" />
                    </svg>
                    {readingNote}
                  </span>
                )}
              </div>
              <p className="m-0 text-[21px] leading-[1.65] tracking-[-0.01em] text-pretty whitespace-pre-line sm:text-[23px]">{c.questionSheet}</p>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  autoFocus
                  onClick={() => sheetRef.current?.close()}
                  className="min-h-11 cursor-pointer rounded-xl bg-ink px-5 text-[15px] font-semibold text-white hover:bg-ink/90"
                >
                  Back to the case
                </button>
              </div>
            </div>
          </dialog>
          {/* Tabs pinned to the top and controls to the bottom; the character's stage fills the
              space between, so switching characters never moves either. */}
          <section aria-label="Role play" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 py-5" style={{ top: BAND_H }}>
            {children}
          </section>
          {zoomed && <div aria-hidden="true" onClick={() => setZoom(false)} className="absolute inset-0 z-[18] bg-ink/35" />}
          {papers && mini.length > 0 && (
            <nav aria-label="Minimised papers" className="absolute bottom-4 left-4 z-[9] flex flex-wrap gap-2">
              {mini.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => restore(id)}
                  aria-label={`Open ${DOC_NAME[id]}`}
                  className="inline-flex min-h-10 animate-fade-up cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-ink shadow-card hover:border-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <rect x="2.5" y="1.5" width="9" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 5h4M5 7.5h4M5 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {DOC_NAME[id]}
                </button>
              ))}
            </nav>
          )}
        </>
      )}

      {prescription && doc("rx", "Prescription", <Prescription p={prescription} />)}
      {dispensingHistory &&
        dispensingHistory.length > 0 &&
        doc(
          "hist",
          "Dispensing history",
          <Sheet title={`Dispensing history${patient ? ` · ${patient}` : ""}`}>
            <DispensingHistory entries={dispensingHistory} />
          </Sheet>,
        )}
      {notes &&
        notes.length > 0 &&
        doc(
          "notes",
          "Notes",
          <Sheet title="Notes">
            {notes.map((n) => (
              <p key={n} className="m-0 text-sm">
                {n}
              </p>
            ))}
          </Sheet>,
        )}
    </main>
  );
}
