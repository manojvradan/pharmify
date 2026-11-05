import type { Metadata } from "next";
import { Suspense } from "react";
import { CasePicker } from "@/components/CasePicker";
import { listPublicCases } from "@/lib/cases/bank";

export const metadata: Metadata = { title: "Surprise interview" };

export default function SessionPickerPage() {
  const cases = listPublicCases().map(({ id, category }) => ({ id, category }));
  return (
    <Suspense>
      <CasePicker cases={cases} />
    </Suspense>
  );
}
