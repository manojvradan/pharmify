"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { Pip } from "@/components/Pip";
import type { Outfit } from "@/lib/pip/items";

/*
 * The signed-in user's Pip, wearing their outfit. The outfit is fetched once per page
 * load and shared by every MyPip on the page; the wardrobe page updates it in place.
 * The last outfit is remembered in this browser so Pip doesn't flash bare on reload.
 */

const CACHE_KEY = "pharmify.pip.outfit";
const EMPTY: Outfit = {};
let outfit: Outfit | null = null;
let requested = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Sets the outfit for every MyPip on the page (after the wardrobe saves, or a pass wins an item). */
export function setMyOutfit(next: Outfit) {
  outfit = next;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {}
  emit();
}

/** Asks the server again, e.g. after a pass may have won something. */
export function refreshMyOutfit() {
  fetch("/api/me/pip", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { outfit?: Outfit } | null) => {
      if (data?.outfit) setMyOutfit(data.outfit);
    })
    .catch(() => {});
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!requested) {
    requested = true;
    refreshMyOutfit();
  }
  return () => listeners.delete(onChange);
}

function snapshot(): Outfit {
  if (outfit) return outfit;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) outfit = JSON.parse(cached) as Outfit;
  } catch {}
  return outfit ?? EMPTY;
}

export function useMyOutfit(): Outfit {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Pip as the signed-in user has dressed them. Use plain <Pip> on signed-out pages. */
export function MyPip(props: Omit<ComponentProps<typeof Pip>, "outfit">) {
  return <Pip {...props} outfit={useMyOutfit()} />;
}
