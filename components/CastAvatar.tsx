import type { CSSProperties, ReactNode } from "react";
import { CAST, type CastId } from "@/lib/cast";

/**
 * The cast, drawn from the "Meet the cast" design sheet. Each character is a body plus the
 * shared mouth, which animates from the CSS variable `--mouth` (0 closed, 1 wide open) on any
 * ancestor; see `useTalkingMouth`. Nothing here re-renders while talking: only the variable changes.
 */

const INK = "#4A2233";

/** The smile from the design sheet, which fades out as a dark open mouth (scaled by --mouth) opens. */
function Mouth() {
  return (
    <>
      <path className="cast-smile" d="M54 70 Q60 75.5 66 70" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <g className="cast-open">
        <ellipse cx="60" cy="72" rx="5" ry="4.5" fill={INK} />
        <ellipse cx="60" cy="73.6" rx="2.8" ry="2" fill="#EC6F9E" />
      </g>
    </>
  );
}

const DRAWINGS: Record<CastId, ReactNode> = {
  "bertie-walsh": (
    <>
      <rect x="51" y="74" width="18" height="20" fill="#F2C9A5" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#E8B44A" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 108 L70 90" stroke="#4A2233" strokeWidth="3" fill="#FFFFFF" strokeLinejoin="round" />
      <path d="M60 108 V122" stroke="#4A2233" strokeWidth="3" />
      <circle cx="55" cy="113" r="2.3" fill="#4A2233" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34.5 60 C30 49 33 40 41 34 C39 43 39 51 41 58 Z" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M85.5 60 C90 49 87 40 79 34 C81 43 81 51 79 58 Z" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 36 Q60 33 70 36 M53 40.5 Q60 38.5 67 40.5" stroke="#4A2233" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#9C97A6" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <circle cx="50" cy="57" r="7.5" stroke="#4A2233" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.25" />
      <circle cx="70" cy="57" r="7.5" stroke="#4A2233" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.25" />
      <path d="M57.5 57 H62.5 M42.5 56 L35 54 M77.5 56 L85 54" stroke="#4A2233" strokeWidth="2.4" />
    </>
  ),
  "kiki-nguyen": (
    <>
      <circle cx="60" cy="19" r="10" fill="#2B2233" stroke="#4A2233" strokeWidth="3" />
      <rect x="51" y="74" width="18" height="20" fill="#F1CDA8" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#C9B3F2" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M44 92 C46 100 74 100 76 92" stroke="#4A2233" strokeWidth="3" fill="#B49CE8" />
      <path d="M54 98 V110 M66 98 V110" stroke="#4A2233" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#F1CDA8" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#F1CDA8" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#F1CDA8" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34 54 C31 31 45 22 60 22 C75 22 89 31 86 54 C80 42 70 35 58 36 C49 39 41 45 34 54 Z" fill="#2B2233" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#4A2233" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3" fill="#4A2233" />
      <circle cx="70" cy="57" r="3" fill="#4A2233" />
      <path d="M46 61.5 Q50 63.5 54 61.5 M66 61.5 Q70 63.5 74 61.5" stroke="#4A2233" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
    </>
  ),
  "wally-morris": (
    <>
      <rect x="51" y="74" width="18" height="20" fill="#E2A87F" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#FF9F43" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="17" y="104" width="86" height="8" fill="#F4F0E8" stroke="#4A2233" strokeWidth="2" />
      <path d="M60 90 V122" stroke="#4A2233" strokeWidth="2.5" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#E2A87F" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#E2A87F" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#E2A87F" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M35 58 C35 80 47 87 60 87 C73 87 85 80 85 58 C81 70 73 74 60 74 C47 74 39 70 35 58 Z" fill="#7A4A2A" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M33 57 C29 32 44 21 60 21 C77 21 91 32 87 57 C85 46 80 40 73 38 C66 42 53 43 44 39 C38 42 35 49 33 57 Z" fill="#7A4A2A" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#5A341E" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
    </>
  ),
  "rosie-costa": (
    <>
      <rect x="51" y="74" width="18" height="20" fill="#F6D5BE" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#FF8CC6" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 104 L70 90" stroke="#4A2233" strokeWidth="3" fill="#FFFFFF" strokeLinejoin="round" />
      <circle cx="49" cy="93" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <circle cx="53" cy="98" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <circle cx="58" cy="101" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <circle cx="63" cy="101" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <circle cx="68" cy="98" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <circle cx="72" cy="93" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.6" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#F6D5BE" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#F6D5BE" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#F6D5BE" stroke="#4A2233" strokeWidth="3.5" />
      <circle cx="36" cy="50" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="38" cy="38" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="46" cy="29" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="57" cy="25" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="68" cy="26" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="78" cy="31" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="84" cy="41" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <circle cx="85" cy="51" r="8.5" fill="#E4E1EA" stroke="#4A2233" strokeWidth="3" />
      <path d="M40 46 C46 36 74 36 80 46" fill="#E4E1EA" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#9C97A6" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <circle cx="34" cy="67" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.8" />
      <circle cx="86" cy="67" r="2.6" fill="#FFFFFF" stroke="#4A2233" strokeWidth="1.8" />
    </>
  ),
  "penny-okafor": (
    <>
      <path d="M80 38 C99 44 100 70 89 86 C87 70 85 58 78 50 Z" fill="#2B1D18" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <rect x="51" y="74" width="18" height="20" fill="#8D5A3B" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#8FD8C0" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M40 93 L80 122" stroke="#4A2233" strokeWidth="7" strokeLinecap="round" />
      <path d="M40 93 L80 122" stroke="#FFC94D" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#8D5A3B" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#8D5A3B" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#8D5A3B" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34 54 C31 31 45 22 60 22 C75 22 89 31 86 54 C80 42 70 35 58 36 C49 39 41 45 34 54 Z" fill="#2B1D18" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#4A2233" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3" fill="#4A2233" />
      <circle cx="70" cy="57" r="3" fill="#4A2233" />
      <path d="M46 61.5 Q50 63.5 54 61.5 M66 61.5 Q70 63.5 74 61.5" stroke="#4A2233" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
    </>
  ),
  "felix-romano": (
    <>
      <rect x="51" y="74" width="18" height="20" fill="#E8B896" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#A9C8F5" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M48 91 L56 104 L60 96 L64 104 L72 91" stroke="#4A2233" strokeWidth="2.6" fill="#FFFFFF" strokeLinejoin="round" />
      <path d="M60 100 V122" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="66" y="108" width="12" height="8" rx="1.5" stroke="#4A2233" strokeWidth="2" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#E8B896" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#E8B896" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#E8B896" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M37 64 C38 80 48 85 60 85 C72 85 82 80 83 64 C79 73 71 77 60 77 C49 77 41 73 37 64 Z" fill="#5A3A2A" opacity="0.28" />
      <path d="M33 57 C29 30 46 20 63 21 C79 22 91 33 87 55 C84 45 79 39 71 37 C60 36 47 41 40 47 C37 50 34 53 33 57 Z" fill="#5A3A2A" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#3E281C" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
    </>
  ),
  "dr-holt": (
    <>
      <path d="M30 72 C23 40 36 19 60 19 C84 19 97 40 90 72 C86 76 80 76 78 71 L78 52 L42 52 L42 71 C40 76 34 76 30 72 Z" fill="#8C6A54" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <rect x="51" y="74" width="18" height="20" fill="#F2C9A5" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 104 L70 90 Z" fill="#A9C8F5" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 90 L56 122 M70 90 L64 122" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M45 92 C40 104 43 112 51 114 M75 92 C80 104 77 110 71 112" stroke="#EC6F9E" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="70" cy="114" r="4.3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.4" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#F2C9A5" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34 54 C31 31 45 22 60 22 C75 22 89 31 86 54 C80 42 70 35 58 36 C49 39 41 45 34 54 Z" fill="#8C6A54" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 26 C40 32 37 40 36 48" stroke="#E4E1EA" strokeWidth="4" strokeLinecap="round" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#6B4F3D" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <rect x="42" y="51.5" width="15" height="11" rx="3" stroke="#4A2233" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.25" />
      <rect x="63" y="51.5" width="15" height="11" rx="3" stroke="#4A2233" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.25" />
      <path d="M57 56 H63 M42 55 L35 53 M78 55 L85 53" stroke="#4A2233" strokeWidth="2.4" />
    </>
  ),
  "dr-kapoor": (
    <>
      <rect x="51" y="74" width="18" height="20" fill="#C68A62" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#5FC3A9" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 104 L70 90" stroke="#4A2233" strokeWidth="2.6" fill="#4AAE94" strokeLinejoin="round" />
      <path d="M45 92 C40 104 43 112 51 114 M75 92 C80 104 77 110 71 112" stroke="#EC6F9E" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="70" cy="114" r="4.3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.4" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#C68A62" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#C68A62" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#C68A62" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M37 64 C38 80 48 85 60 85 C72 85 82 80 83 64 C79 73 71 77 60 77 C49 77 41 73 37 64 Z" fill="#1F1A20" opacity="0.35" />
      <path d="M33 52 C31 28 46 20 60 20 C74 20 89 28 87 52 C80 46 70 43 60 43 C50 43 40 46 33 52 Z" fill="#5FC3A9" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 44 C46 40 74 40 82 44" stroke="#4A2233" strokeWidth="2" opacity="0.4" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#1F1A20" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3" fill="#4A2233" />
      <circle cx="70" cy="57" r="3" fill="#4A2233" />
      <path d="M46 61.5 Q50 63.5 54 61.5 M66 61.5 Q70 63.5 74 61.5" stroke="#4A2233" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
    </>
  ),
  "dr-tan": (
    <>
      <path d="M33 60 C30 76 34 84 40 86 L40 60 Z" fill="#1F1A20" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M87 60 C90 76 86 84 80 86 L80 60 Z" fill="#1F1A20" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <rect x="51" y="74" width="18" height="20" fill="#F0CBA2" />
      <path d="M51 74 V92 M69 74 V92" stroke="#4A2233" strokeWidth="3" />
      <path d="M16 122 C16 101 33 90 60 90 C87 90 104 101 104 122 Z" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 90 L60 104 L70 90 Z" fill="#FFE8F3" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 90 L56 122 M70 90 L64 122" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M45 92 C40 104 43 112 51 114 M75 92 C80 104 77 110 71 112" stroke="#EC6F9E" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx="70" cy="114" r="4.3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.4" />
      <ellipse cx="34.5" cy="58" rx="5.5" ry="7" fill="#F0CBA2" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="85.5" cy="58" rx="5.5" ry="7" fill="#F0CBA2" stroke="#4A2233" strokeWidth="3" />
      <ellipse cx="60" cy="55" rx="26" ry="28" fill="#F0CBA2" stroke="#4A2233" strokeWidth="3.5" />
      <path d="M34 57 C31 30 46 22 60 22 C74 22 89 30 86 57 C83 42 72 33 60 32 C48 33 37 42 34 57 Z" fill="#1F1A20" stroke="#4A2233" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 23 V33" stroke="#4A2233" strokeWidth="2" />
      <path d="M45 49.5 Q50 46.5 55 49 M65 49 Q70 46.5 75 49.5" stroke="#1F1A20" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="50" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="70" cy="57" r="3.2" fill="#4A2233" />
      <circle cx="51.1" cy="55.8" r="1" fill="#FFFFFF" />
      <circle cx="71.1" cy="55.8" r="1" fill="#FFFFFF" />
      <path d="M60 59 Q57.5 64 60.8 65" stroke="#4A2233" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <ellipse cx="75.5" cy="66" rx="4.5" ry="2.8" fill="#F4A0B5" opacity="0.75" />
      <circle cx="34" cy="68" r="2.6" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.8" />
      <circle cx="86" cy="68" r="2.6" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.8" />
    </>
  ),
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
      {DRAWINGS[id]}
      <Mouth />
    </svg>
  );
}
