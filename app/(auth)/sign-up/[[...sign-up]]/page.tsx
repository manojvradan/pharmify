import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { AuthPane, clerkAppearance } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthPane mode="sign-up">
      {/* Clerk reads the URL, so it streams in after the prerendered shell (Cache Components). */}
      <Suspense>
        {/* New accounts always go through onboarding first. */}
        <SignUp appearance={clerkAppearance} signInUrl="/sign-in" forceRedirectUrl="/onboarding" />
      </Suspense>
    </AuthPane>
  );
}
