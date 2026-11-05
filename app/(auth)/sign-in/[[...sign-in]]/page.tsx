import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { AuthPane, clerkAppearance } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Log in" };

export default function SignInPage() {
  return (
    <AuthPane mode="sign-in">
      {/* Clerk reads the URL, so it streams in after the prerendered shell (Cache Components). */}
      <Suspense>
        {/*
          Returning users go home (or back to the page that sent them here). Someone new who
          picks Google here gets an account made on the spot, so they go to onboarding.
        */}
        <SignIn
          appearance={clerkAppearance}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/home"
          signUpForceRedirectUrl="/onboarding"
        />
      </Suspense>
    </AuthPane>
  );
}
