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
  // Advanced moves (combat-system.md "S2 Additional Moves"), earned via the
  // campaign: counter (Ch5), heal (Ch6), shield (Ch7).
  counter: {
    id: "counter",
    name: "Counter",
    // Used as the reflect multiplier when an incoming attack lands this turn.
    damageMultiplier: 1.2,
    staminaCost: 20,
    cooldown: 2,
    accuracy: 1,
    kind: "counter",
  },
  heal: {
    id: "heal",
    name: "Heal",
    damageMultiplier: 0,
    staminaCost: 30,
    cooldown: 3,
    accuracy: 1,
    kind: "heal",
    healPercent: 0.2,
  },
  shield: {
    id: "shield",
    name: "Shield",
    damageMultiplier: 0,
    staminaCost: 15,
    cooldown: 2,
    accuracy: 1,
    kind: "guard",
    guardBuff: 0,
    block: 0.5,
  },
};

export const MOVE_IDS = Object.keys(MOVES) as MoveId[];
