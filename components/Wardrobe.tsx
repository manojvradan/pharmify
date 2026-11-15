"use client";

import { useState } from "react";
import { setMyOutfit } from "@/components/MyPip";
import { Pip } from "@/components/Pip";
import { GROUPS, ITEM, ITEMS, SLOT_NAME, SLOTS, type ItemId, type Outfit } from "@/lib/pip/items";

/** The My Pip page: a large preview of Pip and every wardrobe item, grouped by how it is won. */
export function Wardrobe({ owned, initialOutfit }: { owned: ItemId[]; initialOutfit: Outfit }) {
  const [outfit, setOutfit] = useState<Outfit>(initialOutfit);
  const [error, setError] = useState<string | null>(null);
  const latest = owned.at(-1);

  async function save(next: Outfit) {
    const prev = outfit;
    setOutfit(next);
    setMyOutfit(next);
    setError(null);
    try {
      const res = await fetch("/api/me/pip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfit: next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't save");
    } catch (err) {
      setOutfit(prev);
      setMyOutfit(prev);
      setError(err instanceof Error ? err.message : "Couldn't save");
    }
  }

  const wearing = SLOTS.map((s) => outfit[s])
    .filter((id): id is ItemId => Boolean(id))
    .map((id) => ITEM[id].name);

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-[22px] px-[clamp(16px,3vw,40px)] pt-7 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-[clamp(28px,3vw,36px)] font-bold tracking-[-0.015em]">My Pip</h1>
          <p className="m-0 text-muted">Pass a case to win a new item.</p>
        </div>
        <span className="rounded-full border-[1.5px] border-line bg-white px-3.5 py-2 text-sm font-bold">
          {owned.length} of {ITEMS.length} unlocked
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* Preview */}
        <section
          aria-label="Your Pip"
          className="flex-[1_1_300px] overflow-hidden rounded-[28px] border-[1.5px] border-line bg-white min-[700px]:max-w-[380px]"
        >
          <div className="relative flex h-[330px] items-end justify-center bg-[radial-gradient(circle_at_50%_60%,#FFE3F1_0_46%,#FFF4F9_46.2%)]">
            <span aria-hidden="true" className="absolute bottom-[18px] h-[18px] w-[200px] rounded-[50%] bg-ink opacity-[0.08]" />
            <Pip mood="celebrate" size={230} outfit={outfit} />
          </div>
          <div className="flex flex-col gap-3 px-[22px] pt-[18px] pb-[22px]">
            <span className="text-[13px] font-semibold text-subtle">Wearing</span>
            <span className="text-lg font-bold">{wearing.length ? wearing.join(" · ") : "Nothing yet"}</span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => void save({})}
                disabled={wearing.length === 0}
                className="min-h-11 cursor-pointer rounded-[12px] border-[1.5px] border-line bg-white px-4 font-semibold text-ink disabled:cursor-default disabled:opacity-50"
              >
                Take everything off
              </button>
            </div>
            {error && (
              <p role="alert" className="m-0 text-sm font-semibold text-alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Wardrobe */}
        <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-[18px]">
          {latest ? (
            <div className="flex items-center gap-3.5 rounded-[20px] bg-pink-tint px-[18px] py-3.5">
              <span className="relative size-[52px] flex-none overflow-hidden rounded-full bg-white">
                <span className="absolute top-[-1px] left-[6px]">
                  <Pip mood="happy" size={40} outfit={{ [ITEM[latest].slot]: latest }} />
                </span>
              </span>
              <div className="flex flex-col leading-[1.35]">
                <span className="text-[13px] font-bold text-pink-deep">Latest unlock</span>
                <span className="font-semibold">{ITEM[latest].name}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] bg-sun-tint px-[18px] py-3.5 font-semibold">
              Nothing unlocked yet. Pass every fail condition in a case to win your first item.
            </div>
          )}

          {GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`group-${g.id}`} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`group-${g.id}`} className="m-0 flex items-center gap-2.5 text-[19px] font-bold">
                  <span aria-hidden="true" className="size-3 rounded-full" style={{ background: g.dot }} />
                  {g.name}
                </h2>
                <span className="text-[13px] text-subtle">{g.how}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-3">
                {ITEMS.filter((i) => i.group === g.id).map((item) => {
                  const have = owned.includes(item.id);
                  const on = have && outfit[item.slot] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!have}
                      aria-pressed={have ? on : undefined}
                      aria-label={have ? (on ? `Remove ${item.name}` : `Wear ${item.name}`) : `${item.name}, locked`}
                      onClick={() => void save({ ...outfit, [item.slot]: on ? undefined : item.id })}
                      className={`relative flex flex-col items-center gap-1.5 rounded-[18px] px-2.5 py-3 text-center font-[inherit] ${
                        on
                          ? "cursor-pointer border-2 border-pink-link bg-[#FFF4F9]"
                          : have
                            ? "cursor-pointer border-[1.5px] border-line bg-white hover:border-pink-soft"
                            : "cursor-not-allowed border-[1.5px] border-dashed border-[#DDD8E6] bg-[#FBFAFD]"
                      }`}
                    >
                      <span
                        className={`relative size-[86px] overflow-hidden rounded-full ${have ? "" : "opacity-45 grayscale"}`}
                        style={{ background: g.tint }}
                      >
                        <span className="absolute top-0.5 left-[11px]">
                          <Pip mood="happy" size={64} outfit={{ [item.slot]: item.id }} />
                        </span>
                      </span>
                      <span className="text-[15px] leading-[1.2] font-bold">{item.name}</span>
                      <span className="text-xs text-subtle">
                        {have ? (on ? `${SLOT_NAME[item.slot]} · tap to remove` : SLOT_NAME[item.slot]) : "Locked"}
                      </span>
                      {!have && (
                        <span aria-hidden="true" className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-ink">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="3" y="7" width="10" height="7" rx="2" fill="#FFFFFF" />
                            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#FFFFFF" strokeWidth="1.8" />
                          </svg>
                        </span>
                      )}
                      {on && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-pink-link px-2 py-0.5 text-[11px] font-bold text-white">
                          Wearing
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
