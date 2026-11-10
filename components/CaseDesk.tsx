"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { PublicCase } from "@/lib/cases/schema";

/**
 * The exam desk (design: "Exam mode session"). Before the clock starts, the question sheet
 * sits centred with the case papers laid out under it to read. Once it starts, the question
 * sheet docks as a band along the top and the papers slide to the edges of the desk, where
 * they can be dragged (mouse, touch, or arrow keys) out of the way of the role play in the
 * middle. The prescription has a "Read" button that brings it to the centre at full size.
 */

type DocId = "rx" | "hist" | "notes";
type Pos = { x: number; y: number };

/** Each paper's natural width, and how small it sits on the desk once the clock is running. */
const DOCS: Record<DocId, { w: number; liveScale: number; tilt: number }> = {
  rx: { w: 600, liveScale: 0.62, tilt: -1.2 },
  hist: { w: 270, liveScale: 1, tilt: 1.5 },
  notes: { w: 290, liveScale: 1, tilt: -0.8 },
};
const BAND_H = 58;
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
        <Field name="Age" value={p.patientAge} />
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

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-[#D9D3E2] bg-white px-4 py-3.5 shadow-[0_20px_40px_-28px_rgba(22,17,42,0.45)]">
      <span className={label}>{title}</span>
      {children}
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
  brief,
  children,
}: {
  c: PublicCase;
  /** False before the clock starts (papers laid out to read), true once it's running. */
  live: boolean;
  /** Under the question sheet before the clock starts: the start button and options. */
  brief: ReactNode;
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
  const [qOpen, setQOpen] = useState(false);
  const reduced = useReducedMotion();
  const stopDrag = useRef<(() => void) | null>(null);

  // Track the desk's size and each paper's height, so the layout fits any screen.
  useLayoutEffect(() => {
    const measure = () => {
      const st = stageRef.current;
      if (!st) return;
      setSize({ w: st.clientWidth, h: st.clientHeight, brief: briefRef.current?.offsetHeight ?? 0 });
      const hs: Partial<Record<DocId, number>> = {};
      for (const id of Object.keys(docRefs.current) as DocId[]) hs[id] = docRefs.current[id]?.offsetHeight ?? 0;
      setHeights(hs);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    if (briefRef.current) ro.observe(briefRef.current);
    return () => ro.disconnect();
  }, [live]);

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
    let y = BAND_H + 28;
    for (const other of ids) {
      if (other === id) break;
      if (other !== "rx") y += (heights[other] ?? 150) + 20;
    }
    return { x: Math.max(8, size.w - DOCS[id].w - 24), y };
  };
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
    if (!live || zoom || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
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

  const placement = (id: DocId) => {
    const moving = drag === id || reduced ? "none" : `left .75s ${EASE}, top .75s ${EASE}, transform .75s ${EASE}, box-shadow .3s`;
    if (!live) {
      const b = briefLayout.out[id] ?? { x: 0, y: 0, s: 1, tilt: 0 };
      return { left: b.x, top: b.y, transform: `rotate(${b.tilt}deg) scale(${b.s})`, zIndex: id === "rx" ? 5 : 4, cursor: "default", transition: moving };
    }
    if (id === "rx" && zoom) {
      const s = Math.min(1, (size.w - 16) / DOCS.rx.w);
      return { left: Math.max(8, (size.w - DOCS.rx.w * s) / 2), top: BAND_H + 38, transform: `scale(${s})`, zIndex: 20, cursor: "default", transition: moving };
    }
    const p = at(id);
    const s = liveScale(id);
    return {
      left: p.x,
      top: p.y,
      transform: drag === id ? `rotate(0deg) scale(${s * 1.03})` : `rotate(${DOCS[id].tilt}deg) scale(${s})`,
      zIndex: top === id ? 7 : 6,
      cursor: drag === id ? "grabbing" : "grab",
      transition: moving,
    };
  };

  const chrome = (id: DocId, title: string) => {
    const big = id === "rx" && !zoom;
    return (
      <div
        aria-hidden={!live}
        className="flex items-center justify-between gap-2 overflow-hidden font-semibold text-subtle transition-[opacity,height] duration-300"
        style={{ height: live ? (big ? 40 : 30) : 0, opacity: live ? 1 : 0, fontSize: big ? 19 : 12 }}
      >
        <span className="inline-flex items-center gap-2">
          <DragDots />
          {title}
        </span>
        {id === "rx" && live && (
          <button
            type="button"
            onClick={() => {
              setTop("rx");
              setZoom((z) => !z);
            }}
            aria-pressed={zoom}
            className="min-h-[1.9em] cursor-pointer rounded-md border border-[#D9D3E2] bg-white px-[0.7em] text-ink"
            style={{ font: "inherit" }}
          >
            {zoom ? "Shrink" : "Read"}
          </button>
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
      tabIndex={live ? 0 : -1}
      aria-label={`${title}. ${live ? `Drag or use the arrow keys to move${id === "rx" ? "; Enter to read it full size" : ""}.` : ""}`}
      onPointerDown={down(id)}
      onKeyDown={key(id)}
      className="absolute origin-top-left touch-none select-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-pink"
      style={{ width: DOCS[id].w, ...placement(id) }}
    >
      {chrome(id, id === "rx" ? "Prescription" : "Drag")}
      {body}
    </div>
  );

  const patient = c.agents.find((a) => a.id === "patient")?.name;

  return (
    <main
      ref={stageRef}
      className="relative flex-1 overflow-hidden bg-canvas bg-[radial-gradient(#E3DEEA_1px,transparent_1px)] bg-size-[22px_22px]"
      style={{ minHeight: live ? 720 : Math.max(640, briefLayout.bottom + 40) }}
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
              <p className={`m-0 min-w-0 flex-1 text-[15px] ${qOpen ? "" : "truncate"}`}>{c.questionSheet}</p>
              <button
                type="button"
                onClick={() => setQOpen(!qOpen)}
                aria-expanded={qOpen}
                className="min-h-9 flex-none cursor-pointer rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-ink"
              >
                {qOpen ? "Less" : "Full text"}
              </button>
            </div>
          </section>
          {/* Tabs, character and controls sit together as one group in the middle of the desk. */}
          <section aria-label="Role play" className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-7 py-6" style={{ top: BAND_H }}>
            {children}
          </section>
          {zoom && <div aria-hidden="true" onClick={() => setZoom(false)} className="absolute inset-0 z-[18] bg-ink/35" />}
        </>
      )}

      {prescription && doc("rx", "Prescription", <Prescription p={prescription} />)}
      {dispensingHistory &&
        dispensingHistory.length > 0 &&
        doc(
          "hist",
          "Dispensing history",
          <Sheet title={`Dispensing history${patient ? ` · ${patient}` : ""}`}>
            {dispensingHistory.map((d, i) => (
              <div
                key={`${d.item}-${d.date}`}
                className={`flex justify-between gap-3 py-1.5 text-sm ${i < dispensingHistory.length - 1 ? "border-b border-line-soft" : ""}`}
              >
                <span>{d.item}</span>
                <span className="flex-none font-mono whitespace-nowrap text-subtle">{d.date}</span>
              </div>
            ))}
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
