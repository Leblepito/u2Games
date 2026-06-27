/**
 * Koh Sawan — the Season 2 island (story-bible-s2.md, lom-system.md).
 *
 * Five zones, each guarded by a Keeper that embodies a Lom element and a
 * philosophy. Cleared linearly; the Spirit Keeper (Golden Temple) is last and,
 * per the bible, only falls to a coordinated partner. Each Keeper is fought as a
 * partner battle (see partnerStore).
 */

import type { Difficulty, Fighter } from "@/features/combat";

export type KeeperId = "water" | "earth" | "fire" | "wind" | "spirit";

export interface Keeper {
  id: KeeperId;
  /** Island zone the Keeper guards. */
  zone: string;
  name: string;
  /** S2 chapter this Keeper resolves (story-bible-s2.md chapter map). */
  chapterId: number;
  difficulty: Difficulty;
  /** The Keeper's teaching. */
  philosophy: string;
  /** How it is beaten (lom-system.md "Keeper Requirements"). */
  hint: string;
  /** Enemy stat overrides for the partner battle. */
  fighter: Partial<Fighter>;
}

export const KEEPERS: readonly Keeper[] = [
  {
    id: "water",
    zone: "Jade Shore",
    name: "Keeper of Water",
    chapterId: 14,
    difficulty: "normal",
    philosophy: "Flowing water cannot be broken.",
    hint: "Fight with the flow, not against it.",
    fighter: { name: "Keeper of Water", maxHp: 170, atk: 18, def: 9, speed: 12, lom: "water" },
  },
  {
    id: "earth",
    zone: "Bloom Valley",
    name: "Keeper of Earth",
    chapterId: 15,
    difficulty: "hard",
    philosophy: "Patient earth carries everything.",
    hint: "Sustained pressure, never one big blow.",
    fighter: { name: "Keeper of Earth", maxHp: 230, atk: 20, def: 14, speed: 8, lom: "earth" },
  },
  {
    id: "fire",
    zone: "Ember Peak",
    name: "Keeper of Fire",
    chapterId: 16,
    difficulty: "hard",
    philosophy: "Fire cleanses by burning.",
    hint: "Cold composure defeats rage.",
    fighter: { name: "Keeper of Fire", maxHp: 200, atk: 26, def: 11, speed: 13, lom: "fire" },
  },
  {
    id: "wind",
    zone: "Mist Forest",
    name: "Keeper of Wind",
    chapterId: 18,
    difficulty: "hard",
    philosophy: "Wind is unseen, yet everywhere.",
    hint: "Sense and read — never charge blindly.",
    fighter: { name: "Keeper of Wind", maxHp: 185, atk: 24, def: 10, speed: 18, lom: "wind" },
  },
  {
    id: "spirit",
    zone: "Golden Temple",
    name: "Keeper of Spirit",
    chapterId: 19,
    difficulty: "hard",
    philosophy: "Balance is everything.",
    hint: "Impossible alone — sync with your partner.",
    fighter: { name: "Keeper of Spirit", maxHp: 270, atk: 28, def: 15, speed: 14, lom: "spirit" },
  },
] as const;

export function getKeeper(id: string): Keeper | undefined {
  return KEEPERS.find((k) => k.id === id);
}

export type KeeperStatus = "defeated" | "active" | "locked";

/** Linear progression: the first not-yet-defeated Keeper is active. */
export function keeperStatus(id: KeeperId, defeated: readonly string[]): KeeperStatus {
  if (defeated.includes(id)) return "defeated";
  const firstOpen = KEEPERS.find((k) => !defeated.includes(k.id));
  return firstOpen?.id === id ? "active" : "locked";
}
