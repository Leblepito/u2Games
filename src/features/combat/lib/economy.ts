/**
 * Arena economy — the RoosterCoin (RC) loop that turns a fight into a wager.
 *
 * Kept pure and free of store/UI imports so the coin math is unit-testable and
 * never duplicated. See docs/gdd/economy.md and docs/specs/combat-system.md.
 */

import type { Difficulty } from "./types";

/** Flat arena prize per difficulty (economy.md "Arena win" table). */
export const DIFFICULTY_REWARD: Record<Difficulty, { coins: number; xp: number }> = {
  easy: { coins: 50, xp: 25 },
  normal: { coins: 100, xp: 50 },
  hard: { coins: 200, xp: 100 },
};

/** Hard mode charges a non-refundable entry fee (economy.md anti-inflation sink). */
export const HARD_MODE_ENTRY_FEE = 50;

export interface RewardBreakdown {
  /** Flat arena prize for the difficulty. */
  base: number;
  /** Stake returned + winnings on a win (2× the wager). 0 when nothing is wagered. */
  payout: number;
  /** Total RoosterCoin credited to the wallet on victory (base + payout). */
  coins: number;
  /** XP granted on victory. */
  xp: number;
  /** Amount that was staked at entry (already spent). */
  wager: number;
}

/**
 * RoosterCoin that must be on hand to enter a match: the wager plus any
 * difficulty entry fee. Spent up front; the wager is only earned back on a win.
 */
export function entryCost(difficulty: Difficulty, wager: number): number {
  const stake = Math.max(0, Math.floor(wager));
  const fee = difficulty === "hard" ? HARD_MODE_ENTRY_FEE : 0;
  return stake + fee;
}

/**
 * Victory economics: the flat prize plus a 2× return on the wager (economy.md
 * "Arena bet: win = 2× return"). The wager was already spent at entry, so a 2×
 * payout nets the player +wager; a loss forfeits it.
 */
export function resolveVictoryReward(difficulty: Difficulty, wager: number): RewardBreakdown {
  const stake = Math.max(0, Math.floor(wager));
  const { coins: base, xp } = DIFFICULTY_REWARD[difficulty];
  const payout = stake > 0 ? stake * 2 : 0;
  return { base, payout, coins: base + payout, xp, wager: stake };
}
