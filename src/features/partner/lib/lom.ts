/**
 * Season 2 Lom partner-sync engine (docs/specs/lom-system.md, story-bible-s2.md).
 *
 * Pure logic — no store/UI. The 2v2 partner battle (next slice) composes these
 * primitives. The element advantage cycle itself is already in the combat
 * engine (`lomMultiplier`); this layer adds the partner *sync* mechanic and the
 * spirit amplification that sync unlocks.
 */

import { lomMultiplier, type LomType } from "@/features/combat";

export interface LomProfile {
  primary: LomType;
  /** Gained from the partner during a battle. */
  secondary: LomType | null;
  /** 1-10, grows as the island is cleared. */
  level: number;
}

export const SYNC_MIN = 0;
export const SYNC_MAX = 100;

/** Sync-changing events (lom-system.md "Partner Sync Mechanics"). */
export type SyncEvent =
  | "same_type_attack" // coordinated same-type attack
  | "protect_partner" // a protective move for the partner
  | "triple_coordinated" // 3 consecutive coordinated turns
  | "partner_damaged"; // the partner took a hit

export const SYNC_DELTA: Record<SyncEvent, number> = {
  same_type_attack: 10,
  protect_partner: 15,
  triple_coordinated: 20,
  partner_damaged: -5,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Apply a sync event, clamped to [0, 100]. */
export function applySyncEvent(sync: number, event: SyncEvent): number {
  return clamp(sync + SYNC_DELTA[event], SYNC_MIN, SYNC_MAX);
}

export type SyncMoveId = "basic_combo" | "dual_strike" | "golden_flame";

export interface SyncMove {
  id: SyncMoveId;
  name: string;
  /** Minimum sync to use it. */
  requiredSync: number;
  /** Combined damage multiplier across both fighters. */
  damageMultiplier: number;
}

/**
 * Sync thresholds (lom-system.md). Dual Strike's "elemental fusion" has no
 * explicit number in the spec; set between the basic combo and the ultimate.
 */
export const SYNC_MOVES: readonly SyncMove[] = [
  { id: "basic_combo", name: "Basic Combo", requiredSync: 30, damageMultiplier: 1.3 },
  { id: "dual_strike", name: "Dual Strike", requiredSync: 60, damageMultiplier: 2.0 },
  { id: "golden_flame", name: "Golden Flame", requiredSync: 90, damageMultiplier: 3.0 },
];

/** Sync moves currently usable at this sync level. */
export function unlockedSyncMoves(sync: number): SyncMove[] {
  return SYNC_MOVES.filter((m) => sync >= m.requiredSync);
}

/** The strongest sync move available, or null below the first threshold. */
export function highestSyncMove(sync: number): SyncMove | null {
  const available = unlockedSyncMoves(sync);
  return available.length ? available[available.length - 1] : null;
}

/**
 * Spirit lom is neutral on the element cycle but is amplified by sync
 * (lom-system.md: 1.0 base → up to 1.8 at 90+). Stepped on the sync tiers.
 */
export function spiritAmplify(sync: number): number {
  if (sync >= 90) return 1.8;
  if (sync >= 60) return 1.4;
  if (sync >= 30) return 1.2;
  return 1.0;
}

/**
 * Element multiplier for a partner attack: the normal lom cycle, except a
 * spirit attacker is amplified by sync instead of the flat 1.0.
 */
export function partnerLomMultiplier(attacker: LomType, defender: LomType, sync: number): number {
  if (attacker === "spirit") return spiritAmplify(sync);
  return lomMultiplier(attacker, defender);
}

export interface CoordState {
  sync: number;
  /** Consecutive coordinated turns toward the +20 bonus. */
  streak: number;
}

/**
 * Track coordinated turns: a broken streak resets it; every 3rd consecutive
 * coordinated turn awards the triple-coordination bonus and resets the streak.
 * (The +10 same-type / +15 protect events are applied separately by the caller.)
 */
export function recordCoordination(state: CoordState, coordinated: boolean): CoordState {
  if (!coordinated) return { ...state, streak: 0 };
  const streak = state.streak + 1;
  if (streak >= 3) {
    return { sync: applySyncEvent(state.sync, "triple_coordinated"), streak: 0 };
  }
  return { ...state, streak };
}
