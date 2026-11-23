import type { Metadata } from "next";
import { CaseHubPage } from "@/components/CaseHubPage";

export const metadata: Metadata = { title: "Ethical cases" };

export default function EthicalHubPage({ searchParams }: PageProps<"/ethical">) {
  return <CaseHubPage category="ethical" searchParams={searchParams} />;
}
