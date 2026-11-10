"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { LogoMark } from "@/components/icons";
import { PilotSignup } from "@/components/PilotSignup";
import { Pip } from "@/components/Pip";

/**
 * The landing page's pinned, scroll-scrubbed story in three scenes: the counter (Pip at the
 * shelves), the script (a practice prescription), and the bottle (Confidence Capsules).
 * Scrolling through the tall section moves `p` from 0 to 1; every shape is interpolated
 * from it. Below the fold the section is still readable without JavaScript: scene one
 * renders at p = 0 and its buttons work.
 */

const INK = "#4A2233";
const MAROON = "#6E1F35";
const PINK = "#FF8CC6";
const SUN = "#FFC94D";
const LILAC = "#C9B3F2";
const MINT = "#8FD8C0";
const SKY = "#A9C8F5";
const PEACH = "#FFB38A";
const CREAM = "#FFF3E2";

/** Fonts are loaded by app/page.tsx (next/font) and exposed as CSS variables. */
const display: CSSProperties = { fontFamily: "var(--font-shrikhand), var(--font-figtree), system-ui, sans-serif", fontWeight: 400 };
const script: CSSProperties = { fontFamily: "var(--font-pacifico), cursive" };
const mono: CSSProperties = { fontFamily: "var(--font-courier-prime), 'Courier New', monospace", fontWeight: 700 };

const btn =
  "inline-flex min-h-14 items-center justify-center rounded-full border-[3px] border-[#4A2233] px-7 text-lg font-extrabold text-[#4A2233] no-underline shadow-[0_5px_0_#4A2233] hover:text-[#4A2233] cursor-pointer";

/** How far through the story (0–1) a scroll target for each chapter sits. */
const CHAPTERS = [
  { label: "The counter", target: 0 },
  { label: "The script", target: 0.5 },
  { label: "The bottle", target: 1 },
];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Every animated value for a scroll position, ported from the design's logic. */
function frame(p: number) {
  const seg = (a: number, b: number) => clamp((p - a) / (b - a));
  const t1 = ease(seg(0.22, 0.42));
  const t2 = ease(seg(0.58, 0.78));
  const mix = (x0: number, x1: number, x2: number) => (t2 > 0 ? lerp(x1, x2, t2) : lerp(x0, x1, t1));
  const mixC = (c0: string, c1: string, c2: string) => {
    const [a, b, c] = [rgb(c0), rgb(c1), rgb(c2)];
    return `rgb(${a.map((v, i) => Math.round(t2 > 0 ? lerp(b[i], c[i], t2) : lerp(v, b[i], t1))).join(",")})`;
  };
  const opA = 1 - ease(seg(0.2, 0.32));
  const opB = ease(seg(0.32, 0.44)) * (1 - ease(seg(0.58, 0.68)));
  const opC = ease(seg(0.68, 0.8));
  const pop = (a: number) => {
    const t = ease(seg(a, a + 0.06));
    return { opacity: t, transform: `scale(${0.4 + 0.6 * t}) rotate(${(1 - t) * -20}deg)` };
  };
  return {
    bg: mixC(CREAM, "#E9DDFB", "#FFE7B3"),
    card: {
      width: `${mix(90, 100, 62)}%`,
      height: `${mix(76, 100, 86)}%`,
      borderRadius: `${mix(40, 10, 64)}px`,
      transform: `translate(-50%, -50%) rotate(${mix(0, -2, 0)}deg)`,
      background: mixC("#FFE3F1", "#FFFBF4", PINK),
    },
    opA,
    opB,
    opC,
    capY: lerp(-160, 0, opC) + 6,
    stickers: [pop(0.8), pop(0.85), pop(0.9)],
    scene: p < 0.33 ? 0 : p < 0.66 ? 1 : 2,
  };
}

/** One headline panel on the left; only the visible one can be focused or clicked. */
function Panel({ op, dir, children }: { op: number; dir: 1 | -1; children: ReactNode }) {
  return (
    <div
      inert={op < 0.5}
      aria-hidden={op < 0.5}
      className="absolute inset-x-0 top-1/2 flex flex-col gap-3 sm:gap-[18px]"
      style={{ opacity: op, transform: `translateY(-50%) translateY(${(1 - op) * 30 * dir}px)` }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="-rotate-4 self-start text-[22px] text-[#B4236E] sm:text-[28px]" style={script}>
      {children}
    </span>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return (
    <h2
      className="m-0 text-[clamp(36px,5.4vw,78px)] leading-[0.98] text-[#6E1F35] [text-shadow:4px_4px_0_#FF8CC6]"
      style={display}
    >
      {children}
    </h2>
  );
}

/** Two shelves of jars, alternating heights and colours. */
function Shelves() {
  const row1 = [PINK, SUN, LILAC, MINT, SKY, PEACH, PINK];
  const row2 = [LILAC, MINT, SKY, PEACH, PINK, SUN, LILAC];
  const jar = (x: number, y: number, h: number, fill: string) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="42" height={h} rx="8" fill={fill} stroke={INK} strokeWidth="3.5" />
      <rect x={x + 5} y={y - 10} width="32" height="12" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <rect x={x + 7} y={y + 14} width="28" height="16" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
    </g>
  );
  return (
    <svg viewBox="0 0 520 300" width="100%" fill="none" aria-hidden="true" className="block">
      {row1.map((c, i) => (i % 2 === 0 ? jar(40 + 64 * i, 66, 52, c) : jar(40 + 64 * i, 74, 44, c)))}
      <rect x="20" y="118" width="480" height="12" rx="4" fill="#D9A06A" stroke={INK} strokeWidth="3.5" />
      {row2.map((c, i) => (i % 2 === 0 ? jar(40 + 64 * i, 156, 44, c) : jar(40 + 64 * i, 148, 52, c)))}
      <rect x="20" y="200" width="480" height="12" rx="4" fill="#D9A06A" stroke={INK} strokeWidth="3.5" />
    </svg>
  );
}

function Counter() {
  return (
    // Starts above 0 so the mortar, pestle and jar standing on the counter aren't clipped.
    <svg viewBox="0 -40 520 190" width="100%" fill="none" aria-hidden="true" className="block">
      <rect x="0" y="20" width="520" height="24" rx="12" fill="#FFFFFF" stroke={INK} strokeWidth="5" />
      <path d="M14 44 H506 V136 Q506 146 496 146 H24 Q14 146 14 136 Z" fill={PINK} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M14 70 H506 M14 96 H506" stroke="#FFFFFF" strokeWidth="6" opacity="0.7" />
      <g transform="translate(240 120)">
        <circle r="22" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
        <path d="M-5 -13 h10 v8 h8 v10 h-8 v8 h-10 v-8 h-8 v-10 h8 z" fill={PINK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(74 -6)">
        <path d="M0 26 Q0 0 30 0 Q60 0 60 26 Z" fill={LILAC} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M44 2 L62 -26" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      </g>
      <g transform="translate(420 -14)">
        <rect x="0" y="0" width="34" height="40" rx="8" fill={SUN} stroke={INK} strokeWidth="4" />
        <rect x="-3" y="-10" width="40" height="12" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="3.5" />
      </g>
    </svg>
  );
}

function Tick() {
  return (
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true" className="flex-none">
      <rect x="1.5" y="1.5" width="19" height="19" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
      <path d="M4 11 L9 16 L18 5" stroke={MAROON} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const fieldLabel = "text-[11px] font-extrabold tracking-[0.08em] uppercase text-[#7A5A66]";

/** Scene two: the practice script. */
function Script() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <text x="300" y="380" textAnchor="middle" transform="rotate(-38 300 340)" fontFamily="var(--font-shrikhand), sans-serif" fontSize="140" fill="none" stroke={MAROON} strokeWidth="2.5" opacity="0.12">
          PRACTICE
        </text>
      </svg>
      <div className="relative flex justify-between gap-3 border-b-[3px] border-double border-[#4A2233] px-[26px] pt-[22px] pb-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-black tracking-[0.1em] uppercase">Practice script No.</span>
          <span className="text-2xl leading-[1.1] text-[#6E1F35]" style={display}>Pip, Pharmacist</span>
          <span className="text-sm" style={{ ...mono, fontWeight: 400 }}>The Pharmify Pharmacy</span>
        </div>
        <span className="text-[22px]" style={mono}>PX-0001</span>
      </div>
      <div className="relative flex flex-wrap gap-x-[22px] gap-y-2.5 border-b-2 border-[#4A2233] px-[26px] py-3 text-sm">
        <div className="flex flex-col"><span className={fieldLabel}>Patient</span><span className="text-[17px]" style={mono}>You</span></div>
        <div className="flex flex-col"><span className={fieldLabel}>Date</span><span className="text-[17px]" style={mono}>Daily</span></div>
        <span className="inline-flex items-center gap-2"><Tick />Voice interviews</span>
        <span className="inline-flex items-center gap-2"><Tick />Hints not permitted</span>
      </div>
      <div className="relative flex flex-1">
        <div className="flex flex-[0_0_46px] items-center justify-center border-r-[3px] border-[#4A2233] bg-[#FF8CC6]">
          <span className="rotate-180 text-xl text-white [-webkit-text-stroke:1px_#4A2233] [writing-mode:vertical-rl]" style={display}>Pharmify Practice</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 bg-[#F6EEFF] px-[22px] py-[18px]">
          <div>
            <span className="block text-[clamp(20px,2.4vw,26px)] leading-[1.1] text-[#6E1F35]" style={display}>Mock oral interview, 20 min</span>
            <span className="text-base" style={mono}>Daily, out loud</span>
          </div>
          <div className="flex justify-between gap-2 rounded-xl border-[2.5px] border-[#4A2233] bg-[#C9B3F2] px-3.5 py-2.5 text-sm" style={mono}>
            <span>Ethical · Legal · Clinical</span><span>Repeats: unlimited</span>
          </div>
          <div>
            <span className="block text-[clamp(18px,2vw,22px)] leading-[1.1] text-[#6E1F35]" style={display}>Debrief, marked to the Board&apos;s criteria</span>
            <span className="text-[15px]" style={mono}>After every case</span>
          </div>
          <div className="mt-auto flex items-baseline gap-3 rounded-xl border-[2.5px] border-[#4A2233] bg-[#FFE3F1] px-3.5 py-2.5">
            <span className="text-[15px]" style={mono}>Pip, Pharmacist</span>
            <span className="text-[26px] leading-none text-[#6E1F35]" style={script}>Pip</span>
          </div>
        </div>
      </div>
    </>
  );
}

/** The card area's design size. */
const STAGE_W = 600;
const STAGE_H = 640;

/**
 * Lays its children out on a fixed 600 × 640 board and scales the board to fit (centred,
 * never larger than 1×), so every sticker and label keeps its proportions on any screen.
 */
function FitStage({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ k: 1, x: 0, y: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const k = Math.min(1, width / STAGE_W, height / STAGE_H);
      setFit({ k, x: (width - STAGE_W * k) / 2, y: (height - STAGE_H * k) / 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} aria-hidden="true">
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.k})` }}
      >
        {children}
      </div>
    </div>
  );
}

const STICKER ="inline-block max-w-[240px] border-[3px] border-[#4A2233] px-4 py-3 text-sm font-black leading-[1.25] tracking-[0.05em] uppercase text-[#4A2233] shadow-[5px_5px_0_#4A2233]";

export function LandingStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = sectionRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - Math.min(window.innerHeight, 860);
        if (total <= 0) return;
        const next = clamp(-r.top / total);
        setP((prev) => (Math.abs(next - prev) > 0.002 ? next : prev));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /** Scrolls to a point in the story (0 = first scene, 1 = last). */
  const go = useCallback((target: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const total = el.offsetHeight - Math.min(window.innerHeight, 860);
    const top = el.getBoundingClientRect().top + window.scrollY;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + total * target, behavior: reduced ? "auto" : "smooth" });
  }, []);

  const f = frame(p);

  return (
    <>
      <header className="relative z-[2] border-b-[3px] border-[#4A2233] bg-[#FFF3E2]">
        <div className="mx-auto flex min-h-[76px] max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
            <LogoMark size={38} pill={CREAM} />
            <span className="text-[22px] font-semibold tracking-[-0.02em] text-brand">Pharmify</span>
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-6 text-base">
            {CHAPTERS.map((ch, i) => (
              <button
                key={ch.label}
                type="button"
                onClick={() => go(ch.target)}
                aria-pressed={f.scene === i}
                className={`hidden min-h-11 cursor-pointer border-0 bg-transparent px-1 font-bold text-[#4A2233] md:inline ${
                  f.scene === i ? "underline decoration-[3px] underline-offset-[6px]" : ""
                }`}
              >
                {ch.label}
              </button>
            ))}
            <Link href="/home" className={`${btn} min-h-[46px] bg-[#FFC94D] px-5 text-base`}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section
        ref={sectionRef}
        id="top"
        aria-label="Pharmify in three scenes"
        className="relative h-[2600px]"
        style={{ background: f.bg }}
      >
        <div className="sticky top-0 h-[min(100svh,860px)] overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[70%] -mt-[1000px] -ml-[1000px] size-[2000px] animate-rays bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.45)_0_7.5deg,transparent_7.5deg_15deg)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(rgba(74,34,51,0.15)_1.6px,transparent_1.8px)] bg-size-[14px_14px] opacity-50"
          />

          <div className="relative mx-auto flex h-full max-w-[1240px] flex-col items-center justify-center gap-4 px-4 sm:px-6 lg:flex-row lg:gap-14">
            {/* Headlines */}
            <div className="relative h-[clamp(230px,36svh,440px)] w-full min-w-0 text-[#4A2233] lg:h-[440px] lg:flex-[1_1_400px]">
              <Panel op={f.opA} dir={-1}>
                <Kicker>Now dispensing</Kicker>
                <Headline>Your oral exam, filled to order.</Headline>
                <p className="m-0 max-w-[38ch] text-[17px] sm:text-[19px]">
                  Practise the oral exam out loud. Get marked against the Board&apos;s criteria.
                </p>
                <div className="flex flex-wrap gap-3.5">
                  <button type="button" onClick={() => go(1)} className={`${btn} bg-[#FF8CC6]`}>
                    Join the pilot
                  </button>
                  <Link href="/home" className={`${btn} bg-white`}>
                    Sign in
                  </Link>
                </div>
              </Panel>
              <Panel op={f.opB} dir={1}>
                <Kicker>Pip prescribes</Kicker>
                <Headline>Daily mock interviews.</Headline>
                <p className="m-0 max-w-[38ch] text-[17px] sm:text-[19px]">
                  Twenty minutes, out loud, with patients and prescribers who stay in character. A debrief after every
                  case.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {["Voice role play", "Hidden facts", "20-minute clock", "No hints"].map((t) => (
                    <span key={t} className="rounded-full border-[2.5px] border-[#4A2233] bg-white px-3.5 py-1.5 text-sm font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              </Panel>
              <Panel op={f.opC} dir={1}>
                <Kicker>Fill your script</Kicker>
                <Headline>Confidence Capsules.</Headline>
                <p className="m-0 max-w-[38ch] text-[17px] sm:text-[19px]">Take one case daily. Results may include exam-day calm.</p>
                <PilotSignup variant="pill" />
                <span className="text-sm">Not affiliated with Ahpra or the Pharmacy Board</span>
              </Panel>
            </div>

            {/* The card that morphs: counter → script → bottle */}
            {/* Drawn at the design's 600 × 640 and scaled as one piece, so stickers and labels shrink with the card. */}
            <FitStage
              className="relative mx-auto h-[clamp(280px,46svh,640px)] w-full max-w-[600px] min-w-0 text-[#4A2233] lg:h-[640px] lg:flex-[1_1_460px]"
            >
              <div
                className="absolute top-1/2 left-1/2 overflow-hidden border-4 border-[#4A2233] shadow-[12px_12px_0_#4A2233]"
                style={f.card}
              >
                <div className="pointer-events-none absolute inset-0" style={{ opacity: f.opA, transform: `scale(${1 - 0.15 * (1 - f.opA)})` }}>
                  <div className="absolute inset-x-[4%] top-[6%]"><Shelves /></div>
                  <div className="absolute bottom-[13%] left-1/4 w-1/2 leading-none">
                    <Pip mood="happy" size={250} className="h-auto w-full" />
                  </div>
                  <div className="absolute inset-x-[-3%] bottom-[-2%]"><Counter /></div>
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-col" style={{ opacity: f.opB, transform: `translateY(${(1 - f.opB) * 24}px)` }}>
                  <Script />
                </div>
                <div className="pointer-events-none absolute inset-0" style={{ opacity: f.opC }}>
                  <span className="absolute top-[12%] bottom-[10%] left-[9%] w-[7%] rounded-full bg-white opacity-35" />
                  <div
                    className="absolute inset-x-[9%] top-[30%] flex flex-col gap-1.5 rounded-[14px] border-4 border-[#4A2233] bg-white px-4 py-3.5"
                    style={{ transform: `rotate(${(1 - f.opC) * 8}deg) scale(${0.9 + 0.1 * f.opC})` }}
                  >
                    <div className="flex justify-between gap-2 border-b-2 border-[#4A2233] pb-[5px] text-[10px] font-extrabold tracking-[0.08em] uppercase">
                      <span>Pharmify Pharmacy</span><span>Rx PX-0001</span>
                    </div>
                    <span className="text-[clamp(20px,2.4vw,26px)] leading-[1.05] text-[#6E1F35]" style={display}>Confidence Capsules</span>
                    <span className="text-sm leading-[1.35]" style={mono}>One case daily. Debrief after each.</span>
                    <div className="flex justify-between gap-2 border-t-2 border-dashed border-[#4A2233] pt-[5px] text-xs" style={mono}>
                      <span>Qty: 3 case types</span><span>Repeats: ∞</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottle cap drops on in the last scene */}
              <div className="pointer-events-none absolute top-0 left-1/2 w-[66%] leading-none" style={{ transform: `translate(-50%, ${f.capY}px)`, opacity: f.opC }}>
                <svg viewBox="0 0 360 80" width="100%" fill="none">
                  <rect x="4" y="4" width="352" height="62" rx="18" fill="#FFFFFF" stroke={INK} strokeWidth="6" />
                  {Array.from({ length: 16 }, (_, i) => (
                    <path key={i} d={`M${22 + 20 * i} 10 V58`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
                  ))}
                  <rect x="4" y="56" width="352" height="20" rx="8" fill="#FFFFFF" stroke={INK} strokeWidth="6" />
                </svg>
              </div>

              <div className="pointer-events-none absolute inset-0">
                <span className="absolute top-[18%] left-[-6%]" style={f.stickers[0]}>
                  <span className={`${STICKER} -rotate-6 bg-[#FFC94D]`}>May cause exam-day calm</span>
                </span>
                <span className="absolute top-[46%] right-[-8%]" style={f.stickers[1]}>
                  <span className={`${STICKER} rotate-5 bg-[#FF8CC6]`}>Take with a 20-minute timer</span>
                </span>
                <span className="absolute bottom-[6%] left-[-2%]" style={f.stickers[2]}>
                  <span className={`${STICKER} -rotate-3 bg-white`}>Original cases only</span>
                </span>
              </div>

              <div className="absolute top-[-10px] left-[-30px] w-[150px] animate-badge leading-none" style={{ opacity: f.opA }}>
                <svg viewBox="0 0 170 170" width="100%">
                  <polygon
                    points="85.0,5.0 95.4,25.9 112.4,9.8 115.0,33.0 136.4,23.7 131.0,46.4 154.3,45.0 141.4,64.5 163.8,71.1 145.0,85.0 163.8,98.9 141.4,105.5 154.3,125.0 131.0,123.6 136.4,146.3 115.0,137.0 112.4,160.2 95.4,144.1 85.0,165.0 74.6,144.1 57.6,160.2 55.0,137.0 33.6,146.3 39.0,123.6 15.7,125.0 28.6,105.5 6.2,98.9 25.0,85.0 6.2,71.1 28.6,64.5 15.7,45.0 39.0,46.4 33.6,23.7 55.0,33.0 57.6,9.8 74.6,25.9"
                    fill={SUN}
                    stroke={INK}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <text x="85" y="80" textAnchor="middle" fontFamily="var(--font-shrikhand), sans-serif" fontSize="20" fill={INK}>Pip&apos;s</text>
                  <text x="85" y="104" textAnchor="middle" fontFamily="var(--font-shrikhand), sans-serif" fontSize="20" fill={INK}>on duty!</text>
                </svg>
              </div>
            </FitStage>
          </div>

          {/* Progress through the story */}
          <div aria-hidden="true" className="absolute bottom-[18px] left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border-[3px] border-[#4A2233] bg-white px-3.5 py-2 shadow-[0_4px_0_#4A2233]">
            <span className="block h-2 w-[120px] overflow-hidden rounded bg-[#EEEBF3]">
              <span className="block h-full bg-[#FF8CC6]" style={{ width: `${Math.round(p * 100)}%` }} />
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
