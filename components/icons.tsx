import { useId, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const LOGO_TONES = {
  /** Maroon line work, for white and light-pink backgrounds. */
  light: { line: "#6E1F35", spark: "#EC6F9E", fill: "#EC6F9E" },
  /** White line work, for the maroon tile and other dark backgrounds. */
  dark: { line: "#FFFFFF", spark: "#FF8CC6", fill: "#FF8CC6" },
} as const;

/**
 * The Pharmify mark: a smiling face with ears, sparkles and a capsule.
 * `pill` is the capsule's empty half and should match the background behind the mark.
 */
export function LogoMark({
  size = 38,
  tone = "light",
  pill = tone === "light" ? "#FFFFFF" : "#6E1F35",
  ...props
}: IconProps & { tone?: keyof typeof LOGO_TONES; pill?: string }) {
  const maskId = useId();
  const c = LOGO_TONES[tone];
  return (
    <svg
      width={size}
      height={Math.round((size * 60) / 72)}
      viewBox="0 0 72 60"
      fill="none"
      aria-hidden="true"
      {...props}
      style={{ flex: "none", ...props.style }}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="72" height="60">
        <rect width="72" height="60" fill="#FFFFFF" />
        <circle cx="32" cy="32" r="20" fill="#000000" />
      </mask>
      <g mask={`url(#${maskId})`} stroke={c.line} strokeWidth="4">
        <circle cx="11" cy="31" r="8.5" />
        <circle cx="11" cy="31" r="3.5" strokeWidth="3" />
        <circle cx="52.5" cy="26" r="7.5" />
        <circle cx="52.5" cy="26" r="3" strokeWidth="3" />
      </g>
      <circle cx="32" cy="32" r="20" stroke={c.line} strokeWidth="4" />
      <path
        d="M32 24 C29 19 21 19 19 25 C17 31 19 38 24 42 C27 45 29.5 46 32 46 C34.5 46 37 45 40 42 C45 38 47 31 45 25 C43 19 35 19 32 24 Z"
        stroke={c.line}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M24 33.5 Q26.5 30 29 33.5 M35 33.5 Q37.5 30 40 33.5 M29 38.5 Q32 41.5 35 38.5"
        stroke={c.line}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M57 4 L55 9.5 M64.5 8.5 L60 12.5 M67 18 L61.5 18.8" stroke={c.spark} strokeWidth="3.5" strokeLinecap="round" />
      <g transform="translate(56 44) rotate(45)">
        <rect x="-6.5" y="-14" width="13" height="28" rx="6.5" fill={pill} />
        <path d="M-6.5 0 V7.5 A6.5 6.5 0 0 0 6.5 7.5 V0 Z" fill={c.fill} />
        <rect x="-6.5" y="-14" width="13" height="28" rx="6.5" stroke={c.line} strokeWidth="3.5" />
        <path d="M-6.5 0 H6.5" stroke={c.line} strokeWidth="3" />
      </g>
    </svg>
  );
}

export function CheckCircle({
  size = 20,
  fill = "#FFE8F3",
  stroke = "#8A1F55",
  ring,
  ...props
}: IconProps & { fill?: string; stroke?: string; ring?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle
        cx="10"
        cy="10"
        r="9"
        fill={fill}
        stroke={ring}
        strokeWidth={ring ? 1.5 : undefined}
      />
      <path
        d="M6 10.2l2.6 2.6L14 7.5"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flame({ size = 48, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={Math.round((size * 56) / 48)}
      viewBox="0 0 48 56"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M24 3 C28 13 41 19 41 34 C41 45.5 33.5 53 24 53 C14.5 53 7 45.5 7 34 C7 26 12 20.5 15.5 15.5 C16.5 21.5 19.5 25 22 25 C20 16 21 8.5 24 3 Z"
        fill="#FF7A45"
        stroke="#16112A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 26 C27 31 32.5 34 32.5 40.5 C32.5 45.5 28.8 48.5 24 48.5 C19.2 48.5 15.5 45.5 15.5 40.5 C15.5 35.5 19.5 33 21 29 C22 32 23.3 33.3 24.2 33.3 C23.6 30.5 23.5 28.2 24 26 Z"
        fill="#FFC94D"
        stroke="#16112A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M31 12 Q34 15 33 19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function HomeIcon({ color = "#403A50", ...props }: IconProps & { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M3 9l7-5.5L17 9v8H3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 17v-4.5h4V17" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function CardsIcon({ color = "#403A50", ...props }: IconProps & { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="2.5" y="5" width="11" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M7 3h8.5A2 2 0 0117.5 5v9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DocIcon({ color = "#403A50", ...props }: IconProps & { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M5 2.5h7l3.5 3.5v11.5H5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 10h5M8 13.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PersonIcon({ color = "#403A50", ...props }: IconProps & { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
      <path d="M3.5 17.5c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect
        x="7"
        y="2.5"
        width="6"
        height="10"
        rx="3"
        fill={filled ? "#16112A" : undefined}
        stroke={filled ? undefined : "#16112A"}
        strokeWidth={filled ? undefined : 1.6}
      />
      <path d="M4 9.5a6 6 0 0012 0M10 15.5v2.5" stroke="#16112A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
