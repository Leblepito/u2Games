import { assign, setup } from "xstate";
import type { Difficulty } from "../lib/types";

interface CombatContext {
  turn: number;
  difficulty: Difficulty;
  winner: "player" | "enemy" | null;
}

type CombatMachineEvent =
  | { type: "START"; difficulty: Difficulty }
  | { type: "PLAYER_ACTED" }
  | { type: "ENEMY_ACTED" }
  | { type: "WIN" }
  | { type: "LOSE" }
  | { type: "RESET" };

/**
 * Phase flow for a 1v1 turn-based battle (docs/specs/combat-system.md).
 * The machine owns the *phase*; the Zustand store owns the fighter data and
 * decides when to emit WIN / LOSE.
 *
 *   idle ──START──▶ playerTurn ──PLAYER_ACTED──▶ enemyTurn ──ENEMY_ACTED──▶ playerTurn …
 *                      │  └WIN▶ victory   └LOSE▶ defeat        │
 *                      └────────────────────────────────────  ┘
 */
export const combatMachine = setup({
  types: {
    context: {} as CombatContext,
    events: {} as CombatMachineEvent,
  },
  actions: {
    begin: assign({
      turn: () => 1,
      winner: () => null,
      difficulty: ({ event }) =>
        event.type === "START" ? event.difficulty : "normal",
    }),
    nextTurn: assign({ turn: ({ context }) => context.turn + 1 }),
    setVictory: assign({ winner: () => "player" as const }),
    setDefeat: assign({ winner: () => "enemy" as const }),
    reset: assign({ turn: () => 0, winner: () => null }),
  },
}).createMachine({
  id: "combat",
  initial: "idle",
  context: {
    turn: 0,
    difficulty: "normal",
    winner: null,
  },
  states: {
    idle: {
      on: { START: { target: "playerTurn", actions: "begin" } },
    },
    playerTurn: {
      on: {
        PLAYER_ACTED: "enemyTurn",
        WIN: { target: "victory", actions: "setVictory" },
        LOSE: { target: "defeat", actions: "setDefeat" },
        RESET: { target: "idle", actions: "reset" },
      },
    },
    enemyTurn: {
      on: {
        ENEMY_ACTED: { target: "playerTurn", actions: "nextTurn" },
        WIN: { target: "victory", actions: "setVictory" },
        LOSE: { target: "defeat", actions: "setDefeat" },
        RESET: { target: "idle", actions: "reset" },
      },
    },
    victory: {
      on: { RESET: { target: "idle", actions: "reset" } },
    },
    defeat: {
      on: { RESET: { target: "idle", actions: "reset" } },
    },
  },
});
