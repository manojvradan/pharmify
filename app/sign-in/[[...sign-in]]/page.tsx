import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      {/* Clerk reads the URL, so it streams in after the prerendered shell (Cache Components). */}
      <Suspense>
        <SignIn />
      </Suspense>
    </main>
  );
}
