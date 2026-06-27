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
import { entryCost, resolveVictoryReward, type RewardBreakdown } from "../lib/economy";
import { combatMachine } from "./combatMachine";
import { useGameStore } from "@/lib/store";

export type BattleReward = RewardBreakdown;

export interface StartBattleConfig {
  playerName?: string;
  difficulty?: Difficulty;
  /** RoosterCoin staked on the match — spent at entry, returned 2× on a win. */
  wager?: number;
  /**
   * Chapter whose boss this fight is. A win on the player's current chapter
   * advances the campaign (story-progress write).
   */
  chapterId?: number;
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
  /** RoosterCoin staked on the active match. */
  wager: number;
  /** Chapter this match resolves, or null for a free arena bout. */
  chapterId: number | null;
  player: Fighter;
  enemy: Fighter;
  log: string[];
  reward: BattleReward | null;
  /** Transient banner — e.g. "not enough RC" or "Chapter cleared". */
  notice: string | null;
  startBattle: (config?: StartBattleConfig) => void;
  playerAction: (moveId: MoveId) => void;
  reset: () => void;
}

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
    wager: 0,
    chapterId: null,
    player: defaultPlayer(""),
    enemy: defaultEnemy(),
    log: [],
    reward: null,
    notice: null,

    startBattle: (config = {}) => {
      const difficulty = config.difficulty ?? "normal";
      const wager = Math.max(0, Math.floor(config.wager ?? 0));

      // Pay to enter: the wager plus any difficulty fee leaves the wallet now.
      // Insufficient funds abort the match without touching combat state.
      const cost = entryCost(difficulty, wager);
      if (cost > 0 && !useGameStore.getState().spendCoins(cost)) {
        set({
          notice: `Need ${cost} RC to enter — you have ${useGameStore.getState().roosterCoins}.`,
        });
        return;
      }

      rng = config.rng ?? Math.random;
      const player = defaultPlayer(config.playerName ?? "", config.player);
      const enemy = defaultEnemy(config.enemy);

      actor.send({ type: "RESET" });
      actor.send({ type: "START", difficulty });
      set({
        player,
        enemy,
        difficulty,
        wager,
        chapterId: config.chapterId ?? null,
        reward: null,
        notice: null,
        log: [
          wager > 0
            ? `Battle start — ${player.name} vs ${enemy.name}! Wager ${wager} RC.`
            : `Battle start — ${player.name} vs ${enemy.name}!`,
        ],
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
        const reward = resolveVictoryReward(state.difficulty, state.wager);
        const game = useGameStore.getState();
        game.addCoins(reward.coins);
        game.addXP(reward.xp);
        log.push(`${pOut.defender.name} is defeated! +${reward.coins} RC, +${reward.xp} XP.`);

        // Story-progress write: clearing the current chapter's boss advances it.
        let notice: string | null = null;
        if (state.chapterId !== null && state.chapterId === game.currentChapter) {
          game.setChapter(state.chapterId + 1);
          notice = `Chapter ${state.chapterId} cleared.`;
          log.push(notice);
        }

        actor.send({ type: "WIN" });
        set({ player: pOut.attacker, enemy: pOut.defender, log, reward, notice });
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
        if (state.wager > 0) log.push(`Wager of ${state.wager} RC forfeited.`);
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
        notice: null,
        wager: 0,
        chapterId: null,
        turn: 0,
      });
    },
  };
});
