import type { Metadata } from "next";
import { CaseHubPage } from "@/components/CaseHubPage";

export const metadata: Metadata = { title: "Complex clinical cases" };

export default function ClinicalHubPage({ searchParams }: PageProps<"/clinical">) {
  return <CaseHubPage category="clinical" searchParams={searchParams} />;
}
