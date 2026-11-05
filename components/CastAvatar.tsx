import type { CSSProperties } from "react";
import { CAST, type CastId } from "@/lib/cast";

/**
 * The animal cast, drawn from the "Pharmify cast" design sheet. Each character is its
 * body plus a separate mouth (smile, beak or trunk) that animates from the CSS variable
 * `--mouth` (0 closed, 1 wide open) on any ancestor; see `useTalkingMouth`. Nothing
 * here re-renders while talking: only the variable changes.
 */

const INK = "#4A2233";

/** A dark open mouth with a tongue, scaled vertically by --mouth. */
function OpenMouth({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g className="cast-open">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} />
      <ellipse cx={cx} cy={cy + ry * 0.35} rx={rx * 0.55} ry={ry * 0.45} fill="#EC6F9E" />
    </g>
  );
}

const DRAWINGS: Record<CastId, { body: React.ReactNode; mouth: React.ReactNode }> = {
  "bertie-bear": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#E8B44A" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="54" cy="104" r="2.5" fill="#4A2233" />
      <circle cx="54" cy="114" r="2.5" fill="#4A2233" />
      <path d="M60 90 V122" stroke="#4A2233" strokeWidth="3" />
      <circle cx="35" cy="36" r="11" fill="#A0683F" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="35" cy="36" r="5" fill="#DFA567" />
      <circle cx="85" cy="36" r="11" fill="#A0683F" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="85" cy="36" r="5" fill="#DFA567" />
      <circle cx="60" cy="60" r="31" fill="#A0683F" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="60" cy="72" rx="14" ry="11" fill="#F2D2B0" stroke="#4A2233" strokeWidth="2.5" />
      <ellipse cx="60" cy="67" rx="5.5" ry="3.8" fill="#4A2233" />
      <circle cx="49" cy="55" r="3.4" fill="#4A2233" />
      <circle cx="71" cy="55" r="3.4" fill="#4A2233" />
      <circle cx="50.2" cy="53.7" r="1.1" fill="#FFFFFF" />
      <circle cx="72.2" cy="53.7" r="1.1" fill="#FFFFFF" />
      <circle cx="49" cy="55" r="8" stroke="#4A2233" strokeWidth="2.5" />
      <circle cx="71" cy="55" r="8" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M57 55 H63" stroke="#4A2233" strokeWidth="2.5" />
      <ellipse cx="38" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="82" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <path className="cast-smile" d="M55.5 74 Q60 78 64.5 74" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={76} rx={4.5} ry={4} />
      </>
    ),
  },
  "kiki-koala": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#C9B3F2" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M52 92 V106 M68 92 V106" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="108" r="2.5" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2" />
      <circle cx="68" cy="108" r="2.5" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2" />
      <circle cx="28" cy="46" r="16" fill="#A9A8B8" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="28" cy="46" r="8" fill="#F4D6E0" />
      <circle cx="92" cy="46" r="16" fill="#A9A8B8" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="92" cy="46" r="8" fill="#F4D6E0" />
      <circle cx="60" cy="62" r="29" fill="#A9A8B8" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="60" cy="68" rx="8" ry="10.5" fill="#4A2233" />
      <path d="M44 58 Q48.5 62 53 58 M67 58 Q71.5 62 76 58" stroke="#4A2233" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="72" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="80" cy="72" rx="5" ry="3.2" fill="#F4A0B5" />
      <path d="M88 22 h7 l-7 8 h7 M98 12 h5 l-5 6 h5" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    mouth: (
      <>
        <path className="cast-smile" d="M56 82 Q60 84 64 82" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={83} rx={4} ry={3.5} />
      </>
    ),
  },
  "wally-wombat": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#FF9A3D" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M34 104 L48 98 M86 104 L72 98 M30 114 L46 108 M90 114 L74 108" stroke="#FFF4D6" strokeWidth="4" strokeLinecap="round" />
      <circle cx="37" cy="38" r="8" fill="#8E6A4E" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="83" cy="38" r="8" fill="#8E6A4E" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="60" cy="62" rx="33" ry="29" fill="#8E6A4E" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="60" cy="72" rx="16" ry="11" fill="#B89274" />
      <rect x="51" y="62" width="18" height="11" rx="5.5" fill="#4A2233" />
      <circle cx="47" cy="54" r="3" fill="#4A2233" />
      <circle cx="73" cy="54" r="3" fill="#4A2233" />
      <circle cx="48.2" cy="52.7" r="1.1" fill="#FFFFFF" />
      <circle cx="74.2" cy="52.7" r="1.1" fill="#FFFFFF" />
      <path d="M42 47 L52 50 M78 47 L68 50" stroke="#4A2233" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="38" cy="68" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="82" cy="68" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <path className="cast-smile" d="M55 79 H65" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={79.5} rx={5} ry={3.6} />
      </>
    ),
  },
  "rosie-rabbit": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#A9C8F5" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="46" cy="95" r="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.5" />
      <circle cx="53" cy="99" r="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.5" />
      <circle cx="60" cy="100" r="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.5" />
      <circle cx="67" cy="99" r="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.5" />
      <circle cx="74" cy="95" r="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.5" />
      <g transform="rotate(-12 46 30)" />
      <ellipse cx="46" cy="26" rx="9" ry="23" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="46" cy="27" rx="4" ry="15" fill="#F7B8CB" />
      <g transform="rotate(12 74 30)" />
      <ellipse cx="74" cy="26" rx="9" ry="23" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="74" cy="27" rx="4" ry="15" fill="#F7B8CB" />
      <circle cx="60" cy="64" r="28" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M57 68 H63 L60 72 Z" fill="#EC6F9E" stroke="#4A2233" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 70 H48 M36 75 L48 73 M84 70 H72 M84 75 L72 73" stroke="#4A2233" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="50" cy="60" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="60" r="3.2" fill="#4A2233" />
      <circle cx="51.2" cy="58.7" r="1.1" fill="#FFFFFF" />
      <circle cx="71.2" cy="58.7" r="1.1" fill="#FFFFFF" />
      <ellipse cx="42" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="78" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <path d="M60 72 V75" stroke="#4A2233" strokeWidth="2.2" strokeLinecap="round" />
        <path className="cast-smile" d="M56 77 Q60 79 60 75 Q60 79 64 77" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={78} rx={3.6} ry={3.2} />
      </>
    ),
  },
  "penny-penguin": {
    body: (
      <>
      <path d="M20 122 C20 100 36 88 60 88 C84 88 100 100 100 122 Z" fill="#2E3550" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M42 122 C42 104 50 96 60 96 C70 96 78 104 78 122 Z" fill="#FFFFFF" />
      <path d="M40 88 Q60 100 80 88 L82 96 Q60 108 38 96 Z" fill="#8FD8C0" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M74 98 L78 114 L70 112 Z" fill="#8FD8C0" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="58" r="31" fill="#2E3550" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M60 46 C53 36 37 40 37 56 C37 72 46 82 60 82 C74 82 83 72 83 56 C83 40 67 36 60 46 Z" fill="#FFFFFF" />
      <circle cx="50" cy="56" r="3.4" fill="#4A2233" />
      <circle cx="70" cy="56" r="3.4" fill="#4A2233" />
      <circle cx="51.2" cy="54.7" r="1.1" fill="#FFFFFF" />
      <circle cx="71.2" cy="54.7" r="1.1" fill="#FFFFFF" />
      <ellipse cx="43" cy="66" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="77" cy="66" rx="5" ry="3.2" fill="#F4A0B5" />
      <path d="M44 28 Q60 18 76 28 L74 34 Q60 26 46 34 Z" fill="#F7A8C4" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="20" r="5" fill="#F7A8C4" stroke="#4A2233" strokeWidth="2.5" />
      </>
    ),
    mouth: (
      <>
        <ellipse className="cast-open" cx="60" cy="70" rx="4.2" ry="3.4" fill="#4A2233" />
        <path className="cast-jaw" d="M56.5 68.5 L60 72 L63.5 68.5" fill="#FFB347" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M56.5 68.5 L53 65 L67 65 L63.5 68.5" fill="#FFB347" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      </>
    ),
  },
  "felix-fox": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#7FA2D6" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M48 90 L56 102 L60 92 L64 102 L72 90" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 102 V122" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M33 48 L35 16 L56 34 Z" fill="#F08A4B" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M38 40 L39 25 L49 34 Z" fill="#FFE3C8" />
      <path d="M87 48 L85 16 L64 34 Z" fill="#F08A4B" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M82 40 L81 25 L71 34 Z" fill="#FFE3C8" />
      <circle cx="60" cy="60" r="29" fill="#F08A4B" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M32 63 Q42 72 60 72 Q78 72 88 63 Q86 88 60 89 Q34 88 32 63 Z" fill="#FFF4EA" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="60" cy="72" rx="5" ry="3.5" fill="#4A2233" />
      <circle cx="49" cy="57" r="3.3" fill="#4A2233" />
      <circle cx="71" cy="57" r="3.3" fill="#4A2233" />
      <circle cx="50.2" cy="55.7" r="1.1" fill="#FFFFFF" />
      <circle cx="72.2" cy="55.7" r="1.1" fill="#FFFFFF" />
      <ellipse cx="42" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="78" cy="70" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <path className="cast-smile" d="M56 78 Q60 81 64 78" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={80} rx={4} ry={3.6} />
      </>
    ),
  },
  "dr-hoot": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 108 L70 90" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M60 108 V122" stroke="#4A2233" strokeWidth="3" />
      <path d="M46 92 C42 104 44 112 52 114 M74 92 C78 104 76 110 70 112" stroke="#EC6F9E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="68" cy="114" r="4.5" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M34 40 L32 20 L48 32 Z M86 40 L88 20 L72 32 Z" fill="#9C7A5B" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="60" cy="60" r="31" fill="#9C7A5B" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34 76 Q60 96 86 76 Q76 84 60 84 Q44 84 34 76 Z" fill="#D9BFA0" />
      <circle cx="47" cy="58" r="12" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3" />
      <circle cx="73" cy="58" r="12" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3" />
      <circle cx="48" cy="59" r="5" fill="#4A2233" />
      <circle cx="72" cy="59" r="5" fill="#4A2233" />
      <circle cx="49.5" cy="57.5" r="1.5" fill="#FFFFFF" />
      <circle cx="73.5" cy="57.5" r="1.5" fill="#FFFFFF" />
      <path d="M37 45 L56 50 M83 45 L64 50" stroke="#4A2233" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    mouth: (
      <>
        <ellipse className="cast-open" cx="60" cy="75" rx="3" ry="3" fill="#4A2233" />
        <path className="cast-jaw" d="M58 74 L60 78 L62 74" fill="#FFB347" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M58 74 L56 70 L64 70 L62 74" fill="#FFB347" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      </>
    ),
  },
  "dr-kip": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#6CC3B5" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M48 90 L60 106 L72 90" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <rect x="66" y="104" width="12" height="9" rx="2" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2" />
      <g transform="rotate(-14 44 30)" />
      <ellipse cx="44" cy="24" rx="8" ry="19" fill="#C98B55" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="44" cy="26" rx="3.5" ry="12" fill="#F2C9A0" />
      <g transform="rotate(14 76 30)" />
      <ellipse cx="76" cy="24" rx="8" ry="19" fill="#C98B55" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="76" cy="26" rx="3.5" ry="12" fill="#F2C9A0" />
      <ellipse cx="60" cy="60" rx="27" ry="29" fill="#C98B55" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="60" cy="73" rx="15" ry="12" fill="#EBC59A" stroke="#4A2233" strokeWidth="2.5" />
      <ellipse cx="60" cy="68" rx="5.5" ry="3.6" fill="#4A2233" />
      <circle cx="50" cy="55" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="55" r="3.2" fill="#4A2233" />
      <circle cx="51.2" cy="53.7" r="1.1" fill="#FFFFFF" />
      <circle cx="71.2" cy="53.7" r="1.1" fill="#FFFFFF" />
      <path d="M43 46 L54 48 M77 46 L66 48" stroke="#4A2233" strokeWidth="2.8" strokeLinecap="round" />
      <ellipse cx="40" cy="66" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="80" cy="66" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <path className="cast-smile" d="M56 77 Q60 80 64 77" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
        <OpenMouth cx={60} cy={79} rx={4} ry={3.6} />
      </>
    ),
  },
  "dr-tusk": {
    body: (
      <>
      <path d="M20 122 C20 100 36 90 60 90 C84 90 100 100 100 122 Z" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 108 L70 90" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M60 108 V122" stroke="#4A2233" strokeWidth="3" />
      <path d="M48 96 V122" stroke="#5127D1" strokeWidth="3" />
      <rect x="40" y="108" width="16" height="11" rx="2" fill="#E6D0FF" stroke="#4A2233" strokeWidth="2" />
      <ellipse cx="27" cy="58" rx="19" ry="24" fill="#B8B6C8" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="27" cy="58" rx="10" ry="15" fill="#F4D6E0" />
      <ellipse cx="93" cy="58" rx="19" ry="24" fill="#B8B6C8" stroke="#4A2233" strokeWidth="3.5" />
      <ellipse cx="93" cy="58" rx="10" ry="15" fill="#F4D6E0" />
      <circle cx="60" cy="56" r="27" fill="#B8B6C8" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="49" cy="52" r="3.2" fill="#4A2233" />
      <circle cx="71" cy="52" r="3.2" fill="#4A2233" />
      <circle cx="50.2" cy="50.7" r="1.1" fill="#FFFFFF" />
      <circle cx="72.2" cy="50.7" r="1.1" fill="#FFFFFF" />
      <path d="M42 42 L54 44 M78 42 L66 44" stroke="#4A2233" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="64" rx="5" ry="3.2" fill="#F4A0B5" />
      <ellipse cx="80" cy="64" rx="5" ry="3.2" fill="#F4A0B5" />
      </>
    ),
    mouth: (
      <>
        <OpenMouth cx={71} cy={76} rx={3.2} ry={2.8} />
        <path
          className="cast-trunk"
          d="M52 64 C50 80 53 94 63 94 C70 94 72 87 68 85 C63 88 61 82 64 64 Z"
          fill="#B8B6C8"
          stroke="#4A2233"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

export function CastAvatar({
  id,
  size = 132,
  className,
  style,
  decorative = false,
}: {
  id: CastId;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Hide from assistive tech when a visible name is next to it. */
  decorative?: boolean;
}) {
  const d = DRAWINGS[id];
  return (
    <svg
      viewBox="0 0 120 122"
      width={size}
      height={Math.round((size * 122) / 120)}
      fill="none"
      className={className}
      style={style}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": CAST[id].name })}
    >
      {d.body}
      {d.mouth}
    </svg>
  );
}
