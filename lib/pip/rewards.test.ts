import { describe, expect, it } from "vitest";
import { Outfit } from "./items";
import { computeUnlocks, ownedOnly, wear, type Pass } from "./rewards";

const at = (day: number) => new Date(Date.UTC(2026, 10, day));
const pass = (sessionId: string, category: Pass["category"], day: number): Pass => ({ sessionId, category, at: at(day) });

describe("computeUnlocks", () => {
  it("gives nothing without passes", () => {
    expect(computeUnlocks([]).owned).toEqual([]);
  });

  it("wins the next item in the category for each pass, oldest first", () => {
    const u = computeUnlocks([pass("b", "ethical", 2), pass("a", "ethical", 1)]);
    expect(u.owned).toEqual(["halo", "hearts"]);
    expect(u.bySession.get("a")).toEqual(["halo"]);
    expect(u.bySession.get("b")).toEqual(["hearts"]);
  });

  it("stops winning once a category is complete", () => {
    const u = computeUnlocks([1, 2, 3, 4].map((d) => pass(`s${d}`, "legal", d)));
    expect(u.owned).toEqual(["wig", "monocle", "bands"]);
    expect(u.bySession.has("s4")).toBe(false);
  });

  it("awards the crown with the pass that completes every category", () => {
    const u = computeUnlocks([pass("e", "ethical", 1), pass("l", "legal", 2), pass("c", "clinical", 3), pass("c2", "clinical", 4)]);
    expect(u.bySession.get("c")).toEqual(["propeller", "crown"]);
    expect(u.owned.filter((i) => i === "crown")).toHaveLength(1);
  });

  it("skips passes on cases no longer in the bank", () => {
    expect(computeUnlocks([pass("x", undefined, 1)]).owned).toEqual([]);
  });
});

describe("outfits", () => {
  it("wearing an item replaces its slot", () => {
    expect(wear({ hat: "halo", glasses: "hearts" }, ["crown"])).toEqual({ hat: "crown", glasses: "hearts" });
  });

  it("drops items not owned", () => {
    expect(ownedOnly({ hat: "crown", neck: "bowtie" }, ["bowtie"])).toEqual({ neck: "bowtie" });
  });

  it("rejects an item in the wrong slot", () => {
    expect(Outfit.safeParse({ hat: "hearts" }).success).toBe(false);
    expect(Outfit.safeParse({ hat: "wig", neck: "medal" }).success).toBe(true);
  });
});
