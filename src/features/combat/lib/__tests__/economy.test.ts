import { describe, it, expect } from "vitest";

import {
  DIFFICULTY_REWARD,
  HARD_MODE_ENTRY_FEE,
  entryCost,
  resolveVictoryReward,
} from "../economy";

describe("entryCost", () => {
  it("is just the wager for easy/normal", () => {
    expect(entryCost("easy", 0)).toBe(0);
    expect(entryCost("normal", 100)).toBe(100);
  });

  it("adds the hard-mode entry fee on top of the wager", () => {
    expect(entryCost("hard", 0)).toBe(HARD_MODE_ENTRY_FEE);
    expect(entryCost("hard", 100)).toBe(100 + HARD_MODE_ENTRY_FEE);
  });

  it("floors and clamps a negative or fractional wager", () => {
    expect(entryCost("normal", -50)).toBe(0);
    expect(entryCost("normal", 10.9)).toBe(10);
  });
});

describe("resolveVictoryReward", () => {
  it("pays the flat difficulty prize with no wager", () => {
    expect(resolveVictoryReward("normal", 0)).toEqual({
      base: DIFFICULTY_REWARD.normal.coins,
      payout: 0,
      coins: DIFFICULTY_REWARD.normal.coins,
      xp: DIFFICULTY_REWARD.normal.xp,
      wager: 0,
    });
  });

  it("returns 2× the wager on top of the prize (net +wager after entry)", () => {
    const r = resolveVictoryReward("easy", 100);
    expect(r.payout).toBe(200);
    expect(r.coins).toBe(DIFFICULTY_REWARD.easy.coins + 200);
    // Player spent 100 at entry and gets 200 back → net +100 from the wager.
    expect(r.payout - r.wager).toBe(100);
  });

  it("scales the prize by difficulty", () => {
    expect(resolveVictoryReward("hard", 0).coins).toBe(DIFFICULTY_REWARD.hard.coins);
    expect(resolveVictoryReward("hard", 0).xp).toBe(DIFFICULTY_REWARD.hard.xp);
  });
});
