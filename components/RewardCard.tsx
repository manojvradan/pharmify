"use client";

import Link from "next/link";
import { useEffect } from "react";
import { refreshMyOutfit } from "@/components/MyPip";
import { Pip } from "@/components/Pip";
import { GROUPS, ITEM, SLOT_NAME, type ItemId } from "@/lib/pip/items";

/**
 * On a passing debrief: the wardrobe items the pass won. The grade endpoint has already
 * put them on Pip, so this refreshes every MyPip on the page to show them.
 */
export function RewardCard({ reward }: { reward: ItemId[] }) {
  useEffect(() => {
    refreshMyOutfit();
  }, []);

  return (
    <section aria-label="New unlock" className="flex flex-wrap items-center gap-4 rounded-3xl bg-pink-tint px-6 py-5 motion-safe:animate-fade-up">
      <div className="flex gap-2">
        {reward.map((id) => {
          const item = ITEM[id];
          const tint = GROUPS.find((g) => g.id === item.group)!.tint;
          return (
            <span
              key={id}
              className="relative size-16 flex-none overflow-hidden rounded-full border-2 border-white"
              style={{ background: tint }}
            >
              <span className="absolute top-0 left-[8px]">
                <Pip mood="happy" size={48} outfit={{ [item.slot]: id }} />
              </span>
            </span>
          );
        })}
      </div>
      <div className="flex min-w-[200px] flex-[1_1_240px] flex-col leading-[1.35]">
        <span className="text-[13px] font-bold text-pink-deep">{reward.length > 1 ? "New unlocks" : "New unlock"} · Pip&apos;s wearing it</span>
        <span className="text-lg font-bold">{reward.map((id) => ITEM[id].name).join(" + ")}</span>
        <span className="text-sm text-muted">
          {reward.map((id) => SLOT_NAME[ITEM[id].slot]).join(" · ")} item for passing every fail condition
        </span>
      </div>
      <Link
        href="/pip"
        className="inline-flex min-h-11 items-center rounded-[12px] border-[1.5px] border-line bg-white px-4 font-semibold text-ink no-underline hover:text-ink"
      >
        Open wardrobe
      </Link>
    </section>
  );
}
