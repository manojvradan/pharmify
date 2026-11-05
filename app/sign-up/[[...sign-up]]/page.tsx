import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
      {/* Clerk reads the URL, so it streams in after the prerendered shell (Cache Components). */}
      <Suspense>
        <SignUp />
      </Suspense>
    </main>
  );
}
