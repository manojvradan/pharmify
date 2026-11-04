import type { Metadata } from "next";
import { ExamSession } from "@/components/ExamSession";

export const metadata: Metadata = { title: "Exam mode" };

export default function SessionPage() {
  return <ExamSession />;
}
