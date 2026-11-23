import type { Metadata } from "next";
import { CaseHubPage } from "@/components/CaseHubPage";

export const metadata: Metadata = { title: "Legal cases" };

export default function LegalHubPage({ searchParams }: PageProps<"/legal">) {
  return <CaseHubPage category="legal" searchParams={searchParams} />;
}
