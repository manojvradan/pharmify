import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExamSession } from "@/components/ExamSession";
import { ExplainSession } from "@/components/ExplainSession";
import { Pip } from "@/components/Pip";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";
import { voiceEnabled } from "@/lib/voice/elevenlabs";
import { liveKitEnabled } from "@/lib/voice/livekit";

export function generateStaticParams() {
  return caseIds().map((caseId) => ({ caseId }));
}

export const metadata: Metadata = { title: "Exam mode" };

/**
 * Reads the case from the URL. Inside <Suspense> because a client navigation shows one
 * shell shared by every case, which can't know `caseId` yet; each case's page itself is
 * still prerendered from generateStaticParams.
 */
async function CaseSession({ params }: { params: PageProps<"/session/[caseId]">["params"] }) {
  const { caseId } = await params;
  const c = getCase(caseId);
  if (!c) notFound();
  // Only the public part of the case reaches the browser.
  const pub = toPublic(c);
  // Clinical cases are a role play; ethical and legal cases are a spoken answer.
  return pub.format === "explain" ? (
    <ExplainSession case={pub} voice={voiceEnabled()} />
  ) : (
    <ExamSession case={pub} voice={voiceEnabled()} handsFree={liveKitEnabled()} />
  );
}

export default function CaseSessionPage({ params }: PageProps<"/session/[caseId]">) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-muted">
          <Pip mood="exam" size={90} />
          <p className="m-0">Setting up the exam room…</p>
        </main>
      }
    >
      <CaseSession params={params} />
    </Suspense>
  );
}
