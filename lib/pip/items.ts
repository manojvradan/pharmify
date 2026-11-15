import { z } from "zod";
import type { CaseRecord } from "@/lib/cases/schema";

/**
 * Pip's wardrobe: cosmetic items won by passing cases. Safe to import from the browser.
 * Which items a user owns is never stored: it is worked out from their passed sessions
 * (lib/pip/rewards.ts). Only what Pip is wearing is stored, on the profile.
 */

export const SLOTS = ["hat", "glasses", "neck"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_NAME: Record<Slot, string> = { hat: "Head", glasses: "Eyes", neck: "Neck" };

export const ITEM_IDS = [
  "halo",
  "hearts",
  "bowtie",
  "wig",
  "monocle",
  "bands",
  "propeller",
  "goggles",
  "medal",
  "crown",
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export type ItemGroup = "ethical" | "legal" | "clinical" | "legendary";

export type Item = { id: ItemId; slot: Slot; name: string; group: ItemGroup };

/** In unlock order within each category: the first pass in a category wins its first item. */
export const ITEMS: readonly Item[] = [
  { id: "halo", slot: "hat", name: "Golden halo", group: "ethical" },
  { id: "hearts", slot: "glasses", name: "Rose-tinted glasses", group: "ethical" },
  { id: "bowtie", slot: "neck", name: "Heart bow tie", group: "ethical" },
  { id: "wig", slot: "hat", name: "Barrister's wig", group: "legal" },
  { id: "monocle", slot: "glasses", name: "Fine-print monocle", group: "legal" },
  { id: "bands", slot: "neck", name: "Court bands", group: "legal" },
  { id: "propeller", slot: "hat", name: "Pill propeller cap", group: "clinical" },
  { id: "goggles", slot: "glasses", name: "Lab goggles", group: "clinical" },
  { id: "medal", slot: "neck", name: "Capsule medal", group: "clinical" },
  { id: "crown", slot: "hat", name: "Exam-day crown", group: "legendary" },
];

export const ITEM: Record<ItemId, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, Item>;

export const GROUPS: { id: ItemGroup; name: string; dot: string; tint: string; how: string }[] = [
  { id: "ethical", name: "Ethical", dot: "#FF8CC6", tint: "#FFE8F3", how: "Pass Ethical cases" },
  { id: "legal", name: "Legal", dot: "#FFC94D", tint: "#FFF4D6", how: "Pass Legal cases" },
  { id: "clinical", name: "Complex clinical", dot: "#B99CF5", tint: "#EFE6FF", how: "Pass Complex clinical cases" },
  { id: "legendary", name: "Legendary", dot: "#16112A", tint: "#F4F2F8", how: "Pass a case in every category" },
];

export type CaseCategory = CaseRecord["category"];

/** What Pip is wearing, one item per slot at most. */
export const Outfit = z
  .object({ hat: z.enum(ITEM_IDS), glasses: z.enum(ITEM_IDS), neck: z.enum(ITEM_IDS) })
  .partial()
  .refine((o) => SLOTS.every((s) => o[s] === undefined || ITEM[o[s]!].slot === s), "Item worn in the wrong slot");
export type Outfit = z.infer<typeof Outfit>;
