import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Wardrobe } from "@/components/Wardrobe";
import { getWardrobe } from "@/lib/pip/store";

export const metadata: Metadata = { title: "My Pip" };

async function MyWardrobe() {
  const { userId } = await auth();
  if (!userId) notFound(); // proxy.ts sends signed-out visitors to sign in first
  const { owned, outfit } = await getWardrobe(userId);
  return <Wardrobe owned={owned} initialOutfit={outfit} />;
}

export default function PipPage() {
  return (
    <Suspense fallback={<main className="flex-[999_1_560px] px-10 pt-10 text-muted">Opening the wardrobe…</main>}>
      <MyWardrobe />
    </Suspense>
  );
}
