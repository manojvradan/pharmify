import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** The pharmify capsule mark. */
export function LogoMark({ size = 28, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" {...props}>
      <g transform="rotate(-35 14 14)">
        <rect x="8" y="2" width="12" height="24" rx="6" fill="#FFC94D" />
        <path d="M8 15 V8 A6 6 0 0 1 20 8 V15 Z" fill="#FF8CC6" />
        <rect x="8" y="2" width="12" height="24" rx="6" stroke="#16112A" strokeWidth="2" />
        <path d="M8 15 H20" stroke="#16112A" strokeWidth="1.6" />
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
