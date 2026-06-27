import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import type { Rng } from "@/features/combat";

// @/lib/store (zustand persist) reaches for localStorage at import time.
const realLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;

beforeAll(() => {
  const mem = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, String(v)),
    removeItem: (k) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

afterAll(() => {
  if (realLocalStorage === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    (globalThis as { localStorage?: Storage }).localStorage = realLocalStorage;
  }
});

const rng: Rng = () => 0.5;

describe("partnerStore", () => {
  beforeEach(async () => {
    const { usePartnerStore } = await import("../partnerStore");
    usePartnerStore.getState().reset();
  });

  it("builds sync on coordinated same-type attacks and awards the triple bonus", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    // Both allies water; player is the lowest-HP ally so the enemy never hits Yuki.
    usePartnerStore.getState().startBattle({
      player: { lom: "water", maxHp: 50, hp: 50 },
      partner: { lom: "water" },
      enemy: { maxHp: 9999, atk: 5 },
      rng,
    });

    usePartnerStore.getState().round("peck", "peck"); // +10 -> 10
    expect(usePartnerStore.getState().sync).toBe(10);
    usePartnerStore.getState().round("peck", "peck"); // +10 -> 20
    usePartnerStore.getState().round("peck", "peck"); // +10 -> 30, then +20 triple -> 50
    expect(usePartnerStore.getState().sync).toBe(50);
    expect(usePartnerStore.getState().streak).toBe(0); // reset after the bonus
  });

  it("spends sync on a combo strike once a threshold is reached", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    usePartnerStore.getState().startBattle({
      player: { lom: "water", maxHp: 50, hp: 50, atk: 22 },
      partner: { lom: "water", atk: 14 },
      enemy: { maxHp: 9999, atk: 5, def: 10 },
      rng,
    });
    // 3 coordinated rounds -> sync 50 (basic_combo unlocked at 30).
    usePartnerStore.getState().round("peck", "peck");
    usePartnerStore.getState().round("peck", "peck");
    usePartnerStore.getState().round("peck", "peck");

    const before = usePartnerStore.getState().enemy.hp;
    usePartnerStore.getState().syncStrike();
    const after = usePartnerStore.getState();
    // basic_combo: (22+14) * 1.3 * 1.0 (water vs water) - 10 def = 36; then enemy retaliates.
    expect(before - after.enemy.hp).toBeGreaterThanOrEqual(36);
    expect(after.sync).toBe(20); // 50 - 30 threshold
    expect(after.log.some((l) => l.includes("Basic Combo"))).toBe(true);
  });

  it("does nothing but warn when sync is too low for a combo", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    usePartnerStore.getState().startBattle({ enemy: { maxHp: 200 }, rng });
    const hp = usePartnerStore.getState().enemy.hp;
    usePartnerStore.getState().syncStrike();
    expect(usePartnerStore.getState().enemy.hp).toBe(hp);
    expect(usePartnerStore.getState().log.some((l) => l.includes("Not enough sync"))).toBe(true);
  });

  it("drops sync when Yuki takes a hit", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    // Partner is the lowest-HP ally, so the enemy focus-fires Yuki.
    usePartnerStore.getState().startBattle({
      player: { maxHp: 100, hp: 100 },
      partner: { maxHp: 30, hp: 30 },
      enemy: { maxHp: 9999, atk: 8 },
      rng,
    });
    usePartnerStore.getState().round("peck", "peck");
    expect(usePartnerStore.getState().log.some((l) => l.includes("Yuki is hit"))).toBe(true);
  });

  it("wins, banking the reward, when the Keeper falls", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    const { useGameStore } = await import("@/lib/store");
    const coinsBefore = useGameStore.getState().roosterCoins;

    usePartnerStore.getState().startBattle({
      difficulty: "normal",
      player: { atk: 60 },
      partner: { atk: 60 },
      enemy: { maxHp: 30, hp: 30, def: 0 },
      rng,
    });
    usePartnerStore.getState().round("heavy_kick", "heavy_kick");

    expect(usePartnerStore.getState().phase).toBe("victory");
    expect(usePartnerStore.getState().reward).toEqual({ coins: 100, xp: 50 });
    expect(useGameStore.getState().roosterCoins).toBe(coinsBefore + 100);
  });

  it("records a Keeper defeat on the island when the fight is won", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    const { useGameStore } = await import("@/lib/store");
    expect(useGameStore.getState().defeatedKeepers).not.toContain("water");

    usePartnerStore.getState().startBattle({
      keeperId: "water",
      player: { atk: 60 },
      partner: { atk: 60 },
      enemy: { maxHp: 30, hp: 30, def: 0 },
      rng,
    });
    usePartnerStore.getState().round("heavy_kick", "heavy_kick");

    expect(usePartnerStore.getState().phase).toBe("victory");
    expect(useGameStore.getState().defeatedKeepers).toContain("water");
  });

  it("is a defeat only when both roosters fall", async () => {
    const { usePartnerStore } = await import("../partnerStore");
    usePartnerStore.getState().startBattle({
      player: { maxHp: 5, hp: 5, atk: 1 },
      partner: { maxHp: 5, hp: 5, atk: 1 },
      enemy: { maxHp: 9999, atk: 80, def: 0 },
      rng,
    });

    let guard = 0;
    while (usePartnerStore.getState().phase === "playerTurn" && guard < 10) {
      usePartnerStore.getState().round("peck", "peck");
      guard++;
    }
    expect(usePartnerStore.getState().phase).toBe("defeat");
  });
});
