/**
 * Combat domain types — shared by the engine (lib), machine + store (model)
 * and panel (ui). See docs/specs/combat-system.md.
 */

export type LomType = "water" | "earth" | "fire" | "wind" | "spirit";

export type MoveId =
  | "peck"
  | "wing_strike"
  | "heavy_kick"
  | "dodge"
  | "taunt"
  | "fury"
  | "counter"
  | "heal"
  | "shield";

export type MoveKind = "attack" | "guard" | "heal" | "counter";

export interface Move {
  id: MoveId;
  name: string;
  /** Multiplier on attacker ATK. Non-attack moves deal no immediate damage. */
  damageMultiplier: number;
  staminaCost: number;
  /** Turns the move is locked after use (0 = usable every turn). */
  cooldown: number;
  /** Hit chance, 0..1. */
  accuracy: number;
  kind: MoveKind;
  /** Defensive DEF multiplier applied to the user when a guard move is used. */
  guardBuff?: number;
  /** Fraction (0..1) the next incoming hit is reduced by (shield). */
  block?: number;
  /** Fraction of max HP restored to the user (heal). */
  healPercent?: number;
}

export interface Fighter {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  maxStamina: number;
  stamina: number;
  atk: number;
  def: number;
  speed: number;
  lom: LomType;
  /** Remaining cooldown turns per move id. */
  cooldowns: Partial<Record<MoveId, number>>;
  /** One-shot defensive buff (raises effective DEF for the next incoming hit). */
  buffModifier: number;
  /** One-shot fraction the next incoming hit is reduced by (shield). */
  damageReduction: number;
  /** Braced to reflect the next incoming attack (counter). */
  countering: boolean;
}

export type Difficulty = "easy" | "normal" | "hard";

/** Source of randomness, injectable so combat is deterministic in tests. */
export type Rng = () => number;

export interface ActionResult {
  attackerId: string;
  defenderId: string;
  moveId: MoveId;
  hit: boolean;
  critical: boolean;
  damage: number;
  /** Human-readable battle-log line. */
  message: string;
}

export type CombatPhase =
  | "idle"
  | "playerTurn"
  | "enemyTurn"
  | "victory"
  | "defeat";
