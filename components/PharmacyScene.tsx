import type { ReactNode } from "react";

/**
 * The pharmacy behind the counter: aisles, signs, and the counter itself. Patients
 * stand in it (the GP stays in a circle, since that's a phone call). `children` is
 * the character, drawn in a 216-wide box behind the counter top; pass a CastAvatar
 * at size 216. Decorative: the caller labels the scene. From the "Voice session" design.
 */
export function PharmacyScene({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 640 340" width="100%" fill="none" aria-hidden="true" className={className}>
      <rect width="640" height="340" fill="#FFF6EC" />
      <polygon points="0,0 640,0 426,96 214,96" fill="#FDEFF5" />
      <polygon points="0,340 640,340 426,206 214,206" fill="#F3E4D6" />
      <path d="M320 206 L320 340 M267 206 L180 340 M373 206 L460 340 M240 230 H400 M200 262 H440 M150 300 H490" stroke="#4A2233" strokeWidth="1.2" opacity="0.18" />
      <rect x="214" y="96" width="212" height="110" fill="#FFF8F0" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="282" y="122" width="76" height="84" rx="3" fill="#DCEBFF" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M320 122 V206 M290 132 L300 122 M328 140 L346 122" stroke="#4A2233" strokeWidth="2" opacity="0.6" />
      <rect x="300" y="104" width="40" height="12" rx="3" fill="#8FD8C0" stroke="#4A2233" strokeWidth="2" />
      <path d="M84 70 L240 104" stroke="#4A2233" strokeWidth="1.2" opacity="0.18" />
      <polygon points="46,58 214,112 214,204 46,268" fill="#F6D7B5" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="48.2,115.0 61.3,116.7 61.3,80.9 48.2,77.5" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="66.9,117.5 80.0,119.2 80.0,85.7 66.9,82.3" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="85.6,119.9 98.6,121.6 98.6,96.7 85.6,93.7" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="104.2,122.4 117.3,124.1 117.3,95.3 104.2,91.9" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="122.9,124.8 136.0,126.6 136.0,100.1 122.9,96.8" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="141.6,127.3 154.6,129.0 154.6,109.8 141.6,106.7" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="160.2,129.8 173.3,131.5 173.3,109.8 160.2,106.4" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="178.9,132.2 192.0,133.9 192.0,114.6 178.9,111.2" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="197.6,134.7 210.6,136.4 210.6,122.8 197.6,119.8" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="46" y1="114.7" x2="214" y2="136.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="48.2,167.1 61.3,166.5 61.3,130.7 48.2,129.6" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="66.9,166.3 80.0,165.7 80.0,132.2 66.9,131.1" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="85.6,165.5 98.6,164.9 98.6,140.0 85.6,139.2" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="104.2,164.6 117.3,164.1 117.3,135.3 104.2,134.2" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="122.9,163.8 136.0,163.3 136.0,136.8 122.9,135.8" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="141.6,163.0 154.6,162.4 154.6,143.2 141.6,142.4" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="160.2,162.2 173.3,161.6 173.3,139.9 160.2,138.8" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="178.9,161.4 192.0,160.8 192.0,141.5 178.9,140.4" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="197.6,160.6 210.6,160.0 210.6,146.4 197.6,145.7" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="46" y1="167.2" x2="214" y2="159.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="48.2,219.2 61.3,216.3 61.3,180.5 48.2,181.7" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="66.9,215.1 80.0,212.2 80.0,178.7 66.9,180.0" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="85.6,211.0 98.6,208.2 98.6,183.2 85.6,184.8" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="104.2,206.9 117.3,204.1 117.3,175.3 104.2,176.5" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="122.9,202.8 136.0,200.0 136.0,173.5 122.9,174.7" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="141.6,198.7 154.6,195.9 154.6,176.6 141.6,178.2" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="160.2,194.6 173.3,191.8 173.3,170.1 160.2,171.3" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="178.9,190.5 192.0,187.7 192.0,168.3 178.9,169.5" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="197.6,186.4 210.6,183.6 210.6,170.0 197.6,171.5" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="46" y1="219.7" x2="214" y2="182.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="48.2,267.1 61.3,262.2 61.3,226.3 48.2,229.6" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="66.9,260.0 80.0,255.1 80.0,221.6 66.9,224.9" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="85.6,252.9 98.6,247.9 98.6,223.0 85.6,226.7" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="104.2,245.8 117.3,240.8 117.3,212.1 104.2,215.4" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="122.9,238.7 136.0,233.7 136.0,207.3 122.9,210.6" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="141.6,231.6 154.6,226.6 154.6,207.4 141.6,211.0" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="160.2,224.5 173.3,219.5 173.3,197.8 160.2,201.1" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="178.9,217.4 192.0,212.4 192.0,193.0 178.9,196.4" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="197.6,210.3 210.6,205.3 210.6,191.7 197.6,195.3" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="46" y1="268.0" x2="214" y2="204.0" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="-6" y="52" width="52" height="222" fill="#F2C9A0" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="594,58 426,112 426,204 594,268" fill="#F6D7B5" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="591.8,115.0 578.7,116.7 578.7,80.9 591.8,77.5" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="573.1,117.5 560.0,119.2 560.0,85.7 573.1,82.3" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="554.4,119.9 541.4,121.6 541.4,96.7 554.4,93.7" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="535.8,122.4 522.7,124.1 522.7,95.3 535.8,91.9" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="517.1,124.8 504.0,126.6 504.0,100.1 517.1,96.8" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="498.4,127.3 485.4,129.0 485.4,109.8 498.4,106.7" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="479.8,129.8 466.7,131.5 466.7,109.8 479.8,106.4" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="461.1,132.2 448.0,133.9 448.0,114.6 461.1,111.2" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="442.4,134.7 429.4,136.4 429.4,122.8 442.4,119.8" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="594" y1="114.7" x2="426" y2="136.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="591.8,167.1 578.7,166.5 578.7,130.7 591.8,129.6" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="573.1,166.3 560.0,165.7 560.0,132.2 573.1,131.1" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="554.4,165.5 541.4,164.9 541.4,140.0 554.4,139.2" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="535.8,164.6 522.7,164.1 522.7,135.3 535.8,134.2" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="517.1,163.8 504.0,163.3 504.0,136.8 517.1,135.8" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="498.4,163.0 485.4,162.4 485.4,143.2 498.4,142.4" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="479.8,162.2 466.7,161.6 466.7,139.9 479.8,138.8" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="461.1,161.4 448.0,160.8 448.0,141.5 461.1,140.4" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="442.4,160.6 429.4,160.0 429.4,146.4 442.4,145.7" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="594" y1="167.2" x2="426" y2="159.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="591.8,219.2 578.7,216.3 578.7,180.5 591.8,181.7" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="573.1,215.1 560.0,212.2 560.0,178.7 573.1,180.0" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="554.4,211.0 541.4,208.2 541.4,183.2 554.4,184.8" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="535.8,206.9 522.7,204.1 522.7,175.3 535.8,176.5" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="517.1,202.8 504.0,200.0 504.0,173.5 517.1,174.7" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="498.4,198.7 485.4,195.9 485.4,176.6 498.4,178.2" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="479.8,194.6 466.7,191.8 466.7,170.1 479.8,171.3" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="461.1,190.5 448.0,187.7 448.0,168.3 461.1,169.5" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="442.4,186.4 429.4,183.6 429.4,170.0 442.4,171.5" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="594" y1="219.7" x2="426" y2="182.8" stroke="#4A2233" strokeWidth="2.5" />
      <polygon points="591.8,267.1 578.7,262.2 578.7,226.3 591.8,229.6" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="573.1,260.0 560.0,255.1 560.0,221.6 573.1,224.9" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="554.4,252.9 541.4,247.9 541.4,223.0 554.4,226.7" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="535.8,245.8 522.7,240.8 522.7,212.1 535.8,215.4" fill="#FFB38A" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="517.1,238.7 504.0,233.7 504.0,207.3 517.1,210.6" fill="#8FD8C0" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="498.4,231.6 485.4,226.6 485.4,207.4 498.4,211.0" fill="#C9B3F2" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="479.8,224.5 466.7,219.5 466.7,197.8 479.8,201.1" fill="#FFC94D" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="461.1,217.4 448.0,212.4 448.0,193.0 461.1,196.4" fill="#A9C8F5" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="442.4,210.3 429.4,205.3 429.4,191.7 442.4,195.3" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="594" y1="268.0" x2="426" y2="204.0" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="594" y="52" width="52" height="222" fill="#F2C9A0" stroke="#4A2233" strokeWidth="2.5" />
      <path d="M120 0 V26 M196 0 V26 M444 0 V26 M520 0 V26" stroke="#4A2233" strokeWidth="2" />
      <rect x="104" y="24" width="108" height="30" rx="8" fill="#C9B3F2" stroke="#4A2233" strokeWidth="2.5" />
      <text x="158" y="44" textAnchor="middle" fontWeight="700" fontSize="14" fill="#4A2233">Vitamins</text>
      <rect x="428" y="24" width="108" height="30" rx="8" fill="#FFC94D" stroke="#4A2233" strokeWidth="2.5" />
      <text x="482" y="44" textAnchor="middle" fontWeight="700" fontSize="14" fill="#4A2233">Cold &amp; flu</text>
      {/* The character stands behind the counter. */}
      <g transform="translate(212 72)">{children}</g>
      <rect x="-4" y="252" width="648" height="18" rx="4" fill="#FFFFFF" stroke="#4A2233" strokeWidth="3" />
      <rect x="-4" y="270" width="648" height="80" fill="#FFD6E7" stroke="#4A2233" strokeWidth="3" />
      <path d="M160 270 V340 M320 270 V340 M480 270 V340" stroke="#4A2233" strokeWidth="2" opacity="0.35" />
      <rect x="62" y="222" width="34" height="31" rx="4" fill="#FFC94D" stroke="#4A2233" strokeWidth="2.5" />
      <ellipse cx="72" cy="208" rx="8" ry="15" fill="#8FD8C0" stroke="#4A2233" strokeWidth="2.5" transform="rotate(-20 72 208)" />
      <ellipse cx="87" cy="206" rx="8" ry="16" fill="#8FD8C0" stroke="#4A2233" strokeWidth="2.5" transform="rotate(18 87 206)" />
      <path d="M468 252 V202 L476 196 L484 202 L492 196 L500 202 L508 196 L516 202 L524 196 V252 Z" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M490 216 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 z" fill="#FF8CC6" stroke="#4A2233" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="548" y="222" width="22" height="30" rx="5" fill="#FFB347" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="545" y="214" width="28" height="9" rx="3" fill="#FFFFFF" stroke="#4A2233" strokeWidth="2.5" />
      <rect x="553" y="230" width="12" height="12" rx="2" fill="#FFFFFF" />
    </svg>
  );
}
