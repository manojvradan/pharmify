import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/icons";

/** Shared frame for /privacy and /terms: logo header, title, a draft notice, then the sections. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-[760px] items-center px-4 pt-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
          <LogoMark size={34} />
          <span className="text-xl font-bold tracking-[-0.02em] text-brand">Pharmify</span>
        </Link>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col gap-8 px-4 pt-10 pb-20 sm:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[clamp(32px,5vw,44px)] leading-[1.1] font-bold tracking-[-0.02em]">{title}</h1>
          <p className="m-0 text-subtle">Last updated {updated}</p>
        </div>
        <p className="m-0 rounded-xl border-[1.5px] border-peach bg-peach-tint px-4 py-3 text-[15px]">
          This is a draft placeholder while Pharmify is in pilot. It will be replaced by a reviewed version before
          public launch.
        </p>
        <div className="flex flex-col gap-7 text-[16px] leading-relaxed text-ink-2 [&_h2]:m-0 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:m-0 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}

/** Placeholder until a real address is set up; shared with the landing page footer. */
export const CONTACT_EMAIL = "[CONTACT EMAIL]";
