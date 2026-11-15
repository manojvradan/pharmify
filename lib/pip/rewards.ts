import { ITEMS, type CaseCategory, type ItemId, type Outfit } from "./items";

/** A graded session whose result was a pass (every fail condition passed). */
export type Pass = { sessionId: string; category: CaseCategory | undefined; at: Date };

export type Unlocks = {
  /** Every item owned, in the order it was won. */
  owned: ItemId[];
  /** Which items each passing session won (most win one; the pass that completes the set also wins the crown). */
  bySession: Map<string, ItemId[]>;
};

const BY_CATEGORY: Record<CaseCategory, ItemId[]> = {
  ethical: ITEMS.filter((i) => i.group === "ethical").map((i) => i.id),
  legal: ITEMS.filter((i) => i.group === "legal").map((i) => i.id),
  clinical: ITEMS.filter((i) => i.group === "clinical").map((i) => i.id),
};

/**
 * Replays the user's passes oldest first. Each pass wins the next item in its case's
 * category until that category's items run out; the first time every category has a
 * pass, that pass also wins the crown. Deterministic, so the same history always gives
 * the same wardrobe, and nothing needs storing when items are added.
 */
export function computeUnlocks(passes: Pass[]): Unlocks {
  const sorted = [...passes].sort((a, b) => a.at.getTime() - b.at.getTime());
  const count: Record<CaseCategory, number> = { ethical: 0, legal: 0, clinical: 0 };
  const owned: ItemId[] = [];
  const bySession = new Map<string, ItemId[]>();
  let crowned = false;

  for (const p of sorted) {
    if (!p.category) continue; // the case was removed from the bank
    const won: ItemId[] = [];
    const next = BY_CATEGORY[p.category][count[p.category]];
    count[p.category] += 1;
    if (next) won.push(next);
    if (!crowned && count.ethical > 0 && count.legal > 0 && count.clinical > 0) {
      crowned = true;
      won.push("crown");
    }
    if (won.length > 0) {
      owned.push(...won);
      bySession.set(p.sessionId, won);
    }
  }
  return { owned, bySession };
}

/** The outfit with `items` put on, each replacing whatever was in its slot. */
export function wear(outfit: Outfit, items: ItemId[]): Outfit {
  const next = { ...outfit };
  for (const id of items) next[ITEMS.find((i) => i.id === id)!.slot] = id;
  return next;
}

/** Drops anything not owned, so a stored outfit can never show an item the user hasn't won. */
export function ownedOnly(outfit: Outfit, owned: readonly ItemId[]): Outfit {
  const out: Outfit = {};
  for (const [slot, id] of Object.entries(outfit) as [keyof Outfit, ItemId][]) {
    if (owned.includes(id)) out[slot] = id;
  }
  return out;
}
