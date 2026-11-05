import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamSession } from "@/components/ExamSession";
import { ExplainSession } from "@/components/ExplainSession";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";
import { voiceEnabled } from "@/lib/voice/elevenlabs";

export function generateStaticParams() {
  return caseIds().map((caseId) => ({ caseId }));
}

export const metadata: Metadata = { title: "Exam mode" };

export default async function CaseSessionPage({ params }: PageProps<"/session/[caseId]">) {
  const { caseId } = await params;
  const c = getCase(caseId);
  if (!c) notFound();
  // Only the public part of the case reaches the browser.
  const pub = toPublic(c);
  // Clinical cases are a role play; ethical and legal cases are a spoken answer.
  return pub.format === "explain" ? (
    <ExplainSession case={pub} voice={voiceEnabled()} />
  ) : (
    <ExamSession case={pub} voice={voiceEnabled()} />
  );
}
