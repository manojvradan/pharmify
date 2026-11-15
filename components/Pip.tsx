import type { ReactNode } from "react";
import type { ItemId, Outfit } from "@/lib/pip/items";

export type PipMood = "happy" | "celebrate" | "thinking" | "exam";

type PipProps = {
  mood?: PipMood;
  size?: number;
  fur?: string;
  top?: string;
  bottom?: string;
  className?: string;
  /** Wardrobe items to wear (lib/pip/items.ts). */
  outfit?: Outfit;
};

const SMILE_EYES = "M44 77 Q49 70 54 77 M66 77 Q71 70 76 77";
const DOT_EYES =
  "M45.5 74a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0 -7 0M67.5 74a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0 -7 0";
const UP_EYES =
  "M47.5 71a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0 -7 0M69.5 71a3.5 4.5 0 1 0 7 0a3.5 4.5 0 1 0 -7 0";

const MOODS: Record<
  PipMood,
  {
    eyes: string;
    eyeFill: string;
    eyeStroke: number;
    mouth: string;
    mouthFill: string;
    brows?: string;
    spark?: boolean;
    dots?: boolean;
    band?: boolean;
    label: string;
  }
> = {
  happy: {
    eyes: SMILE_EYES,
    eyeFill: "none",
    eyeStroke: 3.2,
    mouth: "M55 87 Q60 92 65 87",
    mouthFill: "none",
    spark: true,
    label: "Pip the monkey, smiling",
  },
  celebrate: {
    eyes: SMILE_EYES,
    eyeFill: "none",
    eyeStroke: 3.2,
    mouth: "M51 85 Q60 99 69 85 Z",
    mouthFill: "#4A2233",
    spark: true,
    label: "Pip the monkey, celebrating",
  },
  thinking: {
    eyes: UP_EYES,
    eyeFill: "#4A2233",
    eyeStroke: 0,
    mouth: "M56 90 Q60 88 64 90",
    mouthFill: "none",
    dots: true,
    label: "Pip the monkey, thinking",
  },
  exam: {
    eyes: DOT_EYES,
    eyeFill: "#4A2233",
    eyeStroke: 0,
    brows: "M44 66.5 L53 69 M76 66.5 L67 69",
    band: true,
    mouth: "M54 87 Q60 92 66 87",
    mouthFill: "none",
    label: "Pip the monkey, locked in for exam mode",
  },
};

const LINE = "#4A2233";

/** Pip, the pharmacist monkey mascot. Width is `size`; height is 4:3 of that. */
export function Pip({
  mood = "happy",
  size = 240,
  fur = "#B97A4E",
  top = "#FFFFFF",
  bottom = "#EC6F9E",
  className,
  outfit,
}: PipProps) {
  const m = MOODS[mood];
  const worn = (id: ItemId) => outfit?.[ACCESSORY_SLOT[id]] === id;
  return (
    <svg
      width={size}
      height={Math.round((size * 4) / 3)}
      viewBox="0 0 120 160"
      fill="none"
      role="img"
      aria-label={m.label}
      className={className}
      style={{ display: "block", flex: "none" }}
    >
      {m.spark && (
        <path
          d="M94 24 L98 13 M102 32 L111 25 M105 42 L115 41"
          stroke={bottom}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      {m.dots && (
        <path
          d="M96 34a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M103 23a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M109 9a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0"
          fill="#FFFFFF"
          stroke={LINE}
          strokeWidth="2"
        />
      )}

      {/* Lab coat */}
      <path
        d="M12 157 C12 127 30 102 60 100 C90 102 108 127 108 157 Z"
        fill={top}
        stroke={LINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 98 L60 124 L72 98 Z"
        fill={fur}
        stroke={LINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M48 105 L40 118 L47 121 L43 131 L60 144 M72 105 L80 118 L73 121 L77 131 L60 144 M60 144 V157 M29 136 V157 M91 136 V157"
        stroke={LINE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M80 140.5 V149.5 M75.5 145 H84.5"
        stroke={bottom}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Ears */}
      <circle cx="22" cy="76" r="15" fill="#DFA567" stroke={LINE} strokeWidth="3.5" />
      <circle cx="98" cy="76" r="15" fill="#DFA567" stroke={LINE} strokeWidth="3.5" />

      {/* Head and face */}
      <circle cx="60" cy="70" r="36" fill={fur} stroke={LINE} strokeWidth="3.5" />
      <path
        d="M60 54 C55 46 44 44 36 50 C29 56 27 66 28 75 C30 90 43 104 60 104 C77 104 90 90 92 75 C93 66 91 56 84 50 C76 44 65 46 60 54 Z"
        fill="#F7D2A8"
        stroke={LINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="41" cy="84" rx="5.5" ry="3.6" fill="#F4A0B5" />
      <ellipse cx="79" cy="84" rx="5.5" ry="3.6" fill="#F4A0B5" />

      {/* Locked-in headband */}
      {m.band && (
        <g>
          <path
            d="M92 60 L104 54 M92 63 L103 68"
            stroke={LINE}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M26 61 Q60 37 94 61 L93 68 Q60 46 27 68 Z"
            fill={bottom}
            stroke={LINE}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      )}
      {m.brows && (
        <path d={m.brows} stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      )}

      {/* Eyes and mouth */}
      <path
        d={m.eyes}
        fill={m.eyeFill}
        stroke={LINE}
        strokeWidth={m.eyeStroke}
        strokeLinecap="round"
      />
      <path
        d={m.mouth}
        fill={m.mouthFill}
        stroke={LINE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Wardrobe: neck, then eyes, then head, so hats sit over everything */}
      {(["bowtie", "bands", "medal", "hearts", "monocle", "goggles", "halo", "wig", "propeller", "crown"] as const).map(
        (id) => worn(id) && <g key={id}>{ACCESSORIES[id]}</g>,
      )}
    </svg>
  );
}

const ACCESSORY_SLOT: Record<ItemId, keyof Outfit> = {
  halo: "hat",
  wig: "hat",
  propeller: "hat",
  crown: "hat",
  hearts: "glasses",
  monocle: "glasses",
  goggles: "glasses",
  bowtie: "neck",
  bands: "neck",
  medal: "neck",
};

const ACCESSORIES: Record<ItemId, ReactNode> = {
  bowtie: (
    <>
      <path d="M60 111 L46 103 L46 119 Z M60 111 L74 103 L74 119 Z" fill="#FF8CC6" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="60" cy="111" r="4" fill="#EC6F9E" stroke={LINE} strokeWidth="2.5" />
    </>
  ),
  bands: (
    <>
      <rect x="53" y="104" width="6.5" height="17" rx="1.5" fill="#FFFFFF" stroke={LINE} strokeWidth="2" />
      <rect x="60.5" y="104" width="6.5" height="17" rx="1.5" fill="#FFFFFF" stroke={LINE} strokeWidth="2" />
    </>
  ),
  medal: (
    <>
      <path d="M50 100 L58 118 M70 100 L62 118" stroke="#A9C8F5" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(60 127) rotate(30)">
        <rect x="-5.5" y="-11" width="11" height="22" rx="5.5" fill="#FFFFFF" />
        <path d="M-5.5 0 V5.5 A5.5 5.5 0 0 0 5.5 5.5 V0 Z" fill="#FF8CC6" />
        <rect x="-5.5" y="-11" width="11" height="22" rx="5.5" stroke={LINE} strokeWidth="2.5" />
        <path d="M-5.5 0 H5.5" stroke={LINE} strokeWidth="2" />
      </g>
    </>
  ),
  hearts: (
    <>
      <path
        d="M49 83 C37 75 38 66 44 66 C47 66 49 69 49 71 C49 69 51 66 54 66 C60 66 61 75 49 83 Z M71 83 C59 75 60 66 66 66 C69 66 71 69 71 71 C71 69 73 66 76 66 C82 66 83 75 71 83 Z"
        fill="#FF8CC6"
        fillOpacity="0.45"
        stroke={LINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M57 70 Q60 67 63 70" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  monocle: (
    <>
      <circle cx="71" cy="74" r="10" fill="#DCEBFF" fillOpacity="0.45" stroke={LINE} strokeWidth="3" />
      <path d="M81 77 Q91 92 84 110" stroke="#FFC94D" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  goggles: (
    <>
      <path d="M24 73 H96" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
      <rect x="37" y="64" width="21" height="19" rx="8" fill="#8FD8C0" fillOpacity="0.6" stroke={LINE} strokeWidth="3" />
      <rect x="62" y="64" width="21" height="19" rx="8" fill="#8FD8C0" fillOpacity="0.6" stroke={LINE} strokeWidth="3" />
    </>
  ),
  halo: (
    <>
      <ellipse cx="60" cy="22" rx="24" ry="6.5" stroke={LINE} strokeWidth="8" />
      <ellipse cx="60" cy="22" rx="24" ry="6.5" stroke="#FFD54D" strokeWidth="4.5" />
    </>
  ),
  wig: (
    <>
      {[
        [26, 60, 8],
        [94, 60, 8],
        [31, 47, 9],
        [89, 47, 9],
        [41, 37, 10],
        [79, 37, 10],
        [60, 32, 11],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke={LINE} strokeWidth="2.5" />
      ))}
    </>
  ),
  propeller: (
    <>
      <path d="M28 56 Q36 30 60 29 V56 Z" fill="#FF8CC6" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M92 56 Q84 30 60 29 V56 Z" fill="#FFC94D" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 56 H96" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      <path d="M60 29 V20" stroke={LINE} strokeWidth="2.5" />
      <ellipse cx="50" cy="19" rx="10" ry="3.5" fill="#A9C8F5" stroke={LINE} strokeWidth="2" />
      <ellipse cx="70" cy="19" rx="10" ry="3.5" fill="#A9C8F5" stroke={LINE} strokeWidth="2" />
      <circle cx="60" cy="19" r="3" fill="#FFC94D" stroke={LINE} strokeWidth="2" />
    </>
  ),
  crown: (
    <>
      <path d="M36 50 L40 24 L51 37 L60 19 L69 37 L80 24 L84 50 Z" fill="#FFC94D" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="42" r="3.5" fill="#FF8CC6" stroke={LINE} strokeWidth="1.8" />
      <circle cx="46" cy="44" r="2.6" fill="#A9C8F5" stroke={LINE} strokeWidth="1.6" />
      <circle cx="74" cy="44" r="2.6" fill="#A9C8F5" stroke={LINE} strokeWidth="1.6" />
    </>
  ),
};
