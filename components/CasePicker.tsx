"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Pip } from "@/components/Pip";

/** Pip picks a random case, optionally within ?category=, then opens it. */
export function CasePicker({ cases }: { cases: { id: string; category: string }[] }) {
  const router = useRouter();
  const category = useSearchParams().get("category");
  const pool = useMemo(() => (category ? cases.filter((c) => c.category === category) : cases), [cases, category]);
  const empty = pool.length === 0;

  useEffect(() => {
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.replace(`/session/${pick.id}`);
  }, [pool, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <Pip mood="thinking" size={110} />
      <p className="m-0 text-xl font-bold">{empty ? "No cases in that category yet." : "Pip is picking a case…"}</p>
    </div>
  );
}
