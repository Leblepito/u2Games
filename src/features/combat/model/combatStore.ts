"use client";

import { create } from "zustand";
import { createActor } from "xstate";

import {
  applyMove,
  chooseEnemyMove,
  createFighter,
  isDefeated,
  startTurn,
} from "../lib/combatEngine";
import type { CombatPhase, Difficulty, Fighter, MoveId, Rng } from "../lib/types";
import { combatMachine } from "./combatMachine";
import { useGameStore } from "@/lib/store";

export interface BattleReward {
  coins: number;
  xp: number;
}

export interface StartBattleConfig {
  playerName?: string;
  difficulty?: Difficulty;
  /** Override the player/enemy fighters (e.g. story bosses). */
  player?: Partial<Fighter>;
  enemy?: Partial<Fighter>;
  /** Injectable randomness — defaults to Math.random. Used by tests. */
  rng?: Rng;
}

interface CombatSlice {
  phase: CombatPhase;
  turn: number;
  difficulty: Difficulty;
  player: Fighter;
  enemy: Fighter;
  log: string[];
  reward: BattleReward | null;
  startBattle: (config?: StartBattleConfig) => void;
  playerAction: (moveId: MoveId) => void;
  reset: () => void;
}

const REWARDS: Record<Difficulty, BattleReward> = {
  easy: { coins: 50, xp: 25 },
  normal: { coins: 100, xp: 50 },
  hard: { coins: 200, xp: 100 },
};

const actor = createActor(combatMachine).start();

let rng: Rng = Math.random;

function phaseOf(value: string): CombatPhase {
  switch (value) {
    case "playerTurn":
    case "enemyTurn":
    case "victory":
    case "defeat":
      return value;
    default:
      return "idle";
  }
}

function defaultPlayer(name: string, over?: Partial<Fighter>): Fighter {
  return createFighter({
    id: "player",
    name: name || "Your Rooster",
    maxHp: 100,
    atk: 22,
    def: 9,
    speed: 12,
    lom: "spirit",
    ...over,
  });
}

function defaultEnemy(over?: Partial<Fighter>): Fighter {
  return createFighter({
    id: "enemy",
    name: "Old Crow",
    maxHp: 80,
    atk: 16,
    def: 6,
    speed: 8,
    lom: "wind",
    ...over,
  });
}

export const useCombatStore = create<CombatSlice>((set, get) => {
  actor.subscribe((snapshot) => {
    set({
      phase: phaseOf(String(snapshot.value)),
      turn: snapshot.context.turn,
      difficulty: snapshot.context.difficulty,
    });
  });

  return {
    phase: "idle",
    turn: 0,
    difficulty: "normal",
    player: defaultPlayer(""),
    enemy: defaultEnemy(),
    log: [],
    reward: null,

    startBattle: (config = {}) => {
      const difficulty = config.difficulty ?? "normal";
      rng = config.rng ?? Math.random;
      const player = defaultPlayer(config.playerName ?? "", config.player);
      const enemy = defaultEnemy(config.enemy);

      actor.send({ type: "RESET" });
      actor.send({ type: "START", difficulty });
      set({
        player,
        enemy,
        difficulty,
        reward: null,
        log: [`Battle start — ${player.name} vs ${enemy.name}!`],
      });
    },

    playerAction: (moveId) => {
      const state = get();
      if (state.phase !== "playerTurn") return;

      const log = [...state.log];

      // 1) Player upkeep + move.
      const player = startTurn(state.player);
      const pOut = applyMove(player, state.enemy, moveId, rng);
      log.push(pOut.result.message);

      if (isDefeated(pOut.defender)) {
        const reward = REWARDS[state.difficulty];
        useGameStore.getState().addCoins(reward.coins);
        useGameStore.getState().addXP(reward.xp);
        log.push(`${pOut.defender.name} is defeated! +${reward.coins} RC, +${reward.xp} XP.`);
        actor.send({ type: "WIN" });
        set({ player: pOut.attacker, enemy: pOut.defender, log, reward });
        return;
      }

      actor.send({ type: "PLAYER_ACTED" });

      // 2) Enemy upkeep + AI move.
      const enemy = startTurn(pOut.defender);
      const enemyMove = chooseEnemyMove(enemy, pOut.attacker, state.difficulty, rng);
      const eOut = applyMove(enemy, pOut.attacker, enemyMove, rng);
      log.push(eOut.result.message);

      if (isDefeated(eOut.defender)) {
        log.push(`${eOut.defender.name} has fallen. Defeat.`);
        actor.send({ type: "LOSE" });
        set({ player: eOut.defender, enemy: eOut.attacker, log });
        return;
      }

      actor.send({ type: "ENEMY_ACTED" });
      set({ player: eOut.defender, enemy: eOut.attacker, log });
    },

    reset: () => {
      actor.send({ type: "RESET" });
      set({
        player: defaultPlayer(""),
        enemy: defaultEnemy(),
        log: [],
        reward: null,
        turn: 0,
      });
    },
  };
});
