import { describe, it, expect, beforeAll, afterAll } from "vitest";

import type { Rng } from "../../lib/types";

// zustand `persist` in @/lib/store reaches for localStorage at import time;
// shim it so the store loads under the node test environment.
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

// Deterministic: 0.5 always hits the move accuracies used here and never crits.
const rng: Rng = () => 0.5;

describe("combatStore", () => {
  it("runs a player attack to victory and grants the reward", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    const coinsBefore = useGameStore.getState().roosterCoins;
    const xpBefore = useGameStore.getState().xp;

    // Glass-cannon player vs a paper enemy so one Heavy Kick ends it.
    useCombatStore.getState().startBattle({
      difficulty: "easy",
      player: { atk: 40 },
      enemy: { maxHp: 20, hp: 20, def: 0 },
      rng,
    });
    expect(useCombatStore.getState().phase).toBe("playerTurn");

    // 40 * 1.8 = 72 dmg >> 20 HP -> instant victory.
    useCombatStore.getState().playerAction("heavy_kick");

    const state = useCombatStore.getState();
    expect(state.phase).toBe("victory");
    expect(state.enemy.hp).toBe(0);
    expect(state.reward).toEqual({ coins: 50, xp: 25 });
    expect(useGameStore.getState().roosterCoins).toBe(coinsBefore + 50);
    expect(useGameStore.getState().xp).toBe(xpBefore + 25);

    // Reset returns to idle for the next match.
    useCombatStore.getState().reset();
    expect(useCombatStore.getState().phase).toBe("idle");
  });

  it("ignores actions when it is not the player's turn", async () => {
    const { useCombatStore } = await import("../combatStore");
    // Fresh idle store (previous test reset it). No-op while idle.
    useCombatStore.getState().reset();
    const before = useCombatStore.getState().log.length;
    useCombatStore.getState().playerAction("peck");
    expect(useCombatStore.getState().log.length).toBe(before);
    expect(useCombatStore.getState().phase).toBe("idle");
  });
});
