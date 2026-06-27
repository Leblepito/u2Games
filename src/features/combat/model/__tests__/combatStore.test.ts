import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

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

// A glass-cannon player vs a paper enemy so one Heavy Kick ends it instantly.
const ONE_SHOT = { player: { atk: 40 }, enemy: { maxHp: 20, hp: 20, def: 0 } };

describe("combatStore", () => {
  beforeEach(async () => {
    const { useCombatStore } = await import("../combatStore");
    useCombatStore.getState().reset();
  });

  it("runs a player attack to victory and grants the flat reward", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    const coinsBefore = useGameStore.getState().roosterCoins;
    const xpBefore = useGameStore.getState().xp;

    useCombatStore.getState().startBattle({ difficulty: "easy", ...ONE_SHOT, rng });
    expect(useCombatStore.getState().phase).toBe("playerTurn");

    // 40 * 1.8 = 72 dmg >> 20 HP -> instant victory.
    useCombatStore.getState().playerAction("heavy_kick");

    const state = useCombatStore.getState();
    expect(state.phase).toBe("victory");
    expect(state.enemy.hp).toBe(0);
    expect(state.reward).toEqual({ base: 50, payout: 0, coins: 50, xp: 25, wager: 0 });
    expect(useGameStore.getState().roosterCoins).toBe(coinsBefore + 50);
    expect(useGameStore.getState().xp).toBe(xpBefore + 25);
  });

  it("ignores actions when it is not the player's turn", async () => {
    const { useCombatStore } = await import("../combatStore");
    // Fresh idle store (beforeEach reset it). No-op while idle.
    const before = useCombatStore.getState().log.length;
    useCombatStore.getState().playerAction("peck");
    expect(useCombatStore.getState().log.length).toBe(before);
    expect(useCombatStore.getState().phase).toBe("idle");
  });

  it("spends the wager at entry and returns 2× it on a win", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    useGameStore.getState().addCoins(500);
    const start = useGameStore.getState().roosterCoins;

    useCombatStore.getState().startBattle({ difficulty: "easy", wager: 100, ...ONE_SHOT, rng });
    // Stake left the wallet immediately.
    expect(useGameStore.getState().roosterCoins).toBe(start - 100);

    useCombatStore.getState().playerAction("heavy_kick");

    const reward = useCombatStore.getState().reward;
    expect(reward).toEqual({ base: 50, payout: 200, coins: 250, xp: 25, wager: 100 });
    // Net wallet change: -100 entry +250 reward = +150 (flat 50 + net wager 100).
    expect(useGameStore.getState().roosterCoins).toBe(start + 150);
  });

  it("rejects a wager the player cannot afford without starting the match", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    const coins = useGameStore.getState().roosterCoins;
    useCombatStore.getState().startBattle({ difficulty: "easy", wager: coins + 1000, rng });

    expect(useCombatStore.getState().phase).toBe("idle");
    expect(useCombatStore.getState().notice).toBeTruthy();
    expect(useGameStore.getState().roosterCoins).toBe(coins); // untouched
  });

  it("forfeits the wager on a defeat", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    useGameStore.getState().addCoins(500);
    const funded = useGameStore.getState().roosterCoins;

    // Weak player, lethal enemy; normal AI always picks its best attack (fury).
    useCombatStore.getState().startBattle({
      difficulty: "normal",
      wager: 100,
      player: { atk: 5, maxHp: 20, hp: 20, def: 0 },
      enemy: { atk: 60 },
      rng,
    });
    expect(useGameStore.getState().roosterCoins).toBe(funded - 100);

    useCombatStore.getState().playerAction("peck");

    expect(useCombatStore.getState().phase).toBe("defeat");
    // No refund — the stake stays spent.
    expect(useGameStore.getState().roosterCoins).toBe(funded - 100);
    expect(useCombatStore.getState().log.some((l) => l.includes("forfeited"))).toBe(true);
  });

  it("advances the campaign when a chapter boss is defeated", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    useGameStore.getState().setChapter(3);

    useCombatStore.getState().startBattle({ difficulty: "easy", chapterId: 3, ...ONE_SHOT, rng });
    useCombatStore.getState().playerAction("heavy_kick");

    expect(useCombatStore.getState().phase).toBe("victory");
    expect(useGameStore.getState().currentChapter).toBe(4);
    expect(useCombatStore.getState().notice).toContain("Chapter 3");
  });

  it("does not advance the campaign for a non-current chapter", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    useGameStore.getState().setChapter(5);

    // Fighting a chapter 2 boss while on chapter 5 must not rewind/advance.
    useCombatStore.getState().startBattle({ difficulty: "easy", chapterId: 2, ...ONE_SHOT, rng });
    useCombatStore.getState().playerAction("heavy_kick");

    expect(useCombatStore.getState().phase).toBe("victory");
    expect(useGameStore.getState().currentChapter).toBe(5);
    expect(useCombatStore.getState().notice).toBeNull();
  });

  it("grants the chapter's move unlocks on a boss win", async () => {
    const { useCombatStore } = await import("../combatStore");
    const { useGameStore } = await import("@/lib/store");

    useGameStore.getState().setChapter(1);
    useCombatStore.getState().startBattle({
      difficulty: "easy",
      chapterId: 1,
      unlocks: ["heavy_kick", "fury"],
      ...ONE_SHOT,
      rng,
    });
    useCombatStore.getState().playerAction("heavy_kick");

    expect(useCombatStore.getState().phase).toBe("victory");
    const moves = useGameStore.getState().unlockedMoves;
    expect(moves).toContain("heavy_kick");
    expect(moves).toContain("fury");
  });

  it("reflects an enemy attack with Counter and can win on the riposte", async () => {
    const { useCombatStore } = await import("../combatStore");
    // Player braces; the enemy's attack lands non-lethally, then the counter
    // (40 * 1.2 = 48) reflects and KOs the 20-HP enemy.
    useCombatStore.getState().startBattle({
      difficulty: "normal",
      player: { atk: 40, def: 0, maxHp: 100, hp: 100 },
      enemy: { atk: 10, def: 0, maxHp: 20, hp: 20 },
      rng,
    });

    useCombatStore.getState().playerAction("counter");

    const state = useCombatStore.getState();
    expect(state.phase).toBe("victory");
    expect(state.enemy.hp).toBe(0);
    expect(state.log.some((l) => l.includes("counters for"))).toBe(true);
  });
});

describe("gameStore unlockMoves", () => {
  it("ships the starter moveset by default", async () => {
    const { useGameStore } = await import("@/lib/store");
    expect(useGameStore.getState().unlockedMoves).toEqual(
      expect.arrayContaining(["peck", "wing_strike", "dodge"]),
    );
  });

  it("adds moves without duplicating", async () => {
    const { useGameStore } = await import("@/lib/store");
    useGameStore.getState().unlockMoves(["heavy_kick", "heavy_kick"]);
    useGameStore.getState().unlockMoves(["heavy_kick"]);
    const heavy = useGameStore.getState().unlockedMoves.filter((m) => m === "heavy_kick");
    expect(heavy).toHaveLength(1);
  });
});
