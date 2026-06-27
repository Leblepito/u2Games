import type { Move, MoveId } from "./types";

/**
 * Season 1 move table — values mirror docs/specs/combat-system.md.
 * Guard moves (dodge, taunt) deal no damage but raise the user's DEF for the
 * next incoming hit via `guardBuff`.
 */
export const MOVES: Record<MoveId, Move> = {
  peck: {
    id: "peck",
    name: "Peck",
    damageMultiplier: 0.6,
    staminaCost: 8,
    cooldown: 0,
    accuracy: 0.95,
    kind: "attack",
  },
  wing_strike: {
    id: "wing_strike",
    name: "Wing Strike",
    damageMultiplier: 1.0,
    staminaCost: 15,
    cooldown: 1,
    accuracy: 0.85,
    kind: "attack",
  },
  heavy_kick: {
    id: "heavy_kick",
    name: "Heavy Kick",
    damageMultiplier: 1.8,
    staminaCost: 25,
    cooldown: 2,
    accuracy: 0.65,
    kind: "attack",
  },
  dodge: {
    id: "dodge",
    name: "Dodge",
    damageMultiplier: 0,
    staminaCost: 10,
    cooldown: 2,
    accuracy: 1,
    kind: "guard",
    guardBuff: 1.0,
  },
  taunt: {
    id: "taunt",
    name: "Taunt",
    damageMultiplier: 0,
    staminaCost: 5,
    cooldown: 3,
    accuracy: 1,
    kind: "guard",
    guardBuff: 0.4,
  },
  fury: {
    id: "fury",
    name: "Fury",
    damageMultiplier: 2.5,
    staminaCost: 40,
    cooldown: 3,
    accuracy: 0.55,
    kind: "attack",
  },
};

export const MOVE_IDS = Object.keys(MOVES) as MoveId[];
