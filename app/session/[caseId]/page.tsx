import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamSession } from "@/components/ExamSession";
import { caseIds, getCase, toPublic } from "@/lib/cases/bank";

export function generateStaticParams() {
  return caseIds().map((caseId) => ({ caseId }));
}

export const metadata: Metadata = { title: "Exam mode" };

export default async function CaseSessionPage({ params }: PageProps<"/session/[caseId]">) {
  const { caseId } = await params;
  const c = getCase(caseId);
  if (!c) notFound();
  // Only the public part of the case reaches the browser.
  return <ExamSession case={toPublic(c)} />;
}
