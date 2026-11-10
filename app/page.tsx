import Link from "next/link";
import { Courier_Prime, Pacifico, Shrikhand } from "next/font/google";
import { LandingStory } from "@/components/LandingStory";
import { CONTACT_EMAIL } from "@/components/LegalPage";
import { LogoMark } from "@/components/icons";

/* The landing page's display faces, loaded here so the rest of the app doesn't download them. */
const shrikhand = Shrikhand({ weight: "400", subsets: ["latin"], variable: "--font-shrikhand" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });
const courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-courier-prime" });

export default function LandingPage() {
  return (
    <div
      className={`${shrikhand.variable} ${pacifico.variable} ${courierPrime.variable} bg-[#FFF3E2] text-[17px] leading-[1.55] text-[#4A2233] [&_a]:text-[#6E1F35] [&_a:hover]:text-[#4A1426]`}
    >
      <LandingStory />

      <footer className="bg-[#6E1F35] text-[#FFF3E2]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-6 px-6 pt-10 pb-12 text-sm">
          <div className="flex max-w-[52ch] flex-col gap-2.5">
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={36} tone="dark" />
              <span className="text-[22px] font-semibold tracking-[-0.02em]">Pharmify</span>
            </span>
            <span>Not affiliated with Ahpra or the Pharmacy Board of Australia.</span>
            <span>© 2026 Pharmify</span>
          </div>
          <nav aria-label="Footer" className="flex gap-7 [&_a]:!text-[#FFF3E2]">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
