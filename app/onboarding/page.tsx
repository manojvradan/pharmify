import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/icons";
import { Onboarding } from "@/components/Onboarding";
import { upcomingSittings } from "@/lib/onboarding";
import { getViewerProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Get started" };

/** Loads saved answers so a candidate who left halfway picks up where they were. */
async function OnboardingWithProfile() {
  const p = await getViewerProfile();
  return (
    <Onboarding
      sittings={upcomingSittings(new Date())}
      initial={{
        examSitting: p?.examSitting ?? null,
        // A completed onboarding with no sitting means "not booked yet" was chosen.
        sittingAnswered: Boolean(p?.examSitting || p?.onboardedAt),
        state: p?.state ?? null,
        internshipStage: p?.internshipStage ?? null,
      }}
    />
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Suspense
        fallback={
          <header className="flex items-center px-[clamp(16px,4vw,40px)] py-5">
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={34} />
              <span className="text-[22px] font-bold tracking-[-0.02em] text-brand">Pharmify</span>
            </span>
          </header>
        }
      >
        <OnboardingWithProfile />
      </Suspense>
    </div>
  );
}
