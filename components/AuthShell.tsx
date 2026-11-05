import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/icons";
import { Pip } from "@/components/Pip";
import { AuthTabs } from "@/components/AuthTabs";

/**
 * The "Sign up / log in" design board: a pink brand panel beside the form. The form is
 * Clerk's <SignIn>/<SignUp>, restyled by `clerkAppearance` below, so Google, Apple,
 * email codes and password reset all come from Clerk. Which social buttons show is set
 * in the Clerk dashboard (SSO connections).
 */

const MODES = {
  "sign-up": { title: "Create your account", sub: "Takes about a minute." },
  "sign-in": { title: "Welcome back", sub: "Log in to pick up where you left off." },
} as const;

/** Brand panel plus the tab switch. Rendered once by app/(auth)/layout.tsx, so it persists between the two pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-canvas text-ink">
      <section
        aria-label="About Pharmify"
        className="relative flex flex-[1_1_420px] flex-col justify-between gap-8 overflow-hidden bg-pink px-[clamp(24px,4vw,56px)] py-10"
      >
        <span aria-hidden="true" className="absolute -top-[90px] -right-[90px] size-80 rounded-full bg-white opacity-[0.18]" />
        <span aria-hidden="true" className="absolute -bottom-20 -left-[60px] size-[220px] rounded-full bg-white opacity-[0.14]" />
        <Link href="/" className="relative inline-flex w-fit items-center gap-2.5 no-underline">
          <LogoMark size={38} />
          <span className="text-2xl font-bold tracking-[-0.02em] text-brand">Pharmify</span>
        </Link>
        <div className="relative flex max-w-[460px] flex-col gap-[22px]">
          <div className="relative size-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#FFE3F1]">
            <div className="absolute top-[-4px] left-3">
              <Pip mood="happy" size={126} />
            </div>
          </div>
          <h1 className="m-0 text-[clamp(32px,3.6vw,46px)] leading-[1.05] font-bold tracking-[-0.02em]">
            Your oral exam, rehearsed out loud.
          </h1>
          <p className="m-0 text-[17px] text-plum">
            Voice interviews with patients and prescribers who stay in character, marked against the Board&apos;s
            criteria.
          </p>
        </div>
        <p className="relative m-0 text-[13px] text-plum">
          Independent practice tool. Not affiliated with Ahpra or the Pharmacy Board of Australia.
        </p>
      </section>

      {/* Top-aligned (not centred) so the tabs stay put when the form below changes height. */}
      <main className="flex flex-[1_1_480px] justify-center px-[clamp(20px,4vw,64px)] pt-[clamp(40px,12vh,128px)] pb-10">
        <div className="group/auth flex w-full max-w-[420px] flex-col gap-[22px]">
          <AuthTabs />
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * One page's half of the form: heading, Clerk, and the "switch" link. It remounts on each
 * switch and slides in from the side of the tab that was picked.
 */
export function AuthPane({ mode, children }: { mode: keyof typeof MODES; children: ReactNode }) {
  return (
    <div
      className={`auth-${mode} flex flex-col gap-[22px] motion-reduce:animate-none ${
        mode === "sign-up" ? "animate-auth-from-left" : "animate-auth-from-right"
      }`}
    >
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-[30px] font-bold tracking-[-0.02em]">{MODES[mode].title}</h2>
        <p className="m-0 text-muted">{MODES[mode].sub}</p>
      </div>
      {children}
      <p className="m-0 text-center text-sm text-subtle">
        {mode === "sign-up" ? "Already have an account? " : "New to Pharmify? "}
        <Link href={mode === "sign-up" ? "/sign-in" : "/sign-up"} className="font-semibold text-pink-link">
          {mode === "sign-up" ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

/**
 * Clerk styling to match the design. ClerkProvider (app/layout.tsx) puts Clerk's CSS in
 * the `clerk` layer, declared before Tailwind's utilities in globals.css, so these classes win.
 */
export const clerkAppearance = {
  options: { socialButtonsVariant: "blockButton", socialButtonsPlacement: "top" },
  variables: {
    colorPrimary: "#16112A",
    colorForeground: "#16112A",
    colorMutedForeground: "#625C70",
    colorDanger: "#8A2914",
    colorInput: "#FFFFFF",
    colorInputForeground: "#16112A",
    colorBorder: "#DDD8E6",
    colorRing: "#FFC2DF",
    fontFamily: "var(--font-figtree), system-ui, sans-serif",
    fontSize: "16px",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-none shadow-none border-0 rounded-none bg-transparent",
    card: "bg-transparent shadow-none border-0 p-0 gap-[22px]",
    header: "hidden",
    footer: "bg-none bg-transparent [&>*:first-child]:hidden",
    socialButtons: "gap-2.5",
    socialButtonsBlockButton: "min-h-[50px] rounded-xl border-[1.5px] border-[#DDD8E6] bg-white font-semibold text-ink shadow-none",
    socialButtonsBlockButtonText: "text-base font-semibold",
    dividerText: "text-[13px] text-subtle",
    dividerLine: "bg-line",
    formFieldLabel: "text-sm font-semibold text-ink",
    formFieldInput: "min-h-[50px] rounded-xl border-[1.5px] border-[#DDD8E6] px-3.5 text-base shadow-none",
    formFieldAction: "text-sm font-semibold text-pink-link",
    formButtonPrimary:
      "mt-1.5 min-h-[54px] rounded-[14px] border-2 border-ink bg-sun text-[17px] font-bold normal-case text-ink shadow-pop hover:bg-sun focus:bg-sun active:bg-sun after:hidden",
    footerActionLink: "font-semibold text-pink-link",
    identityPreviewEditButton: "text-pink-link",
    formResendCodeLink: "text-pink-link",
  },
} as const;
