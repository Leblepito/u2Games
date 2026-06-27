"use client";

import { create } from "zustand";
import { createActor } from "xstate";

import {
  applyMove,
  chooseEnemyMove,
  counterDamage,
  createFighter,
  isDefeated,
  startTurn,
} from "../lib/combatEngine";
import type { CombatPhase, Difficulty, Fighter, MoveId, Rng } from "../lib/types";
import { MOVES } from "../lib/moves";
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
  /** Moves granted to the player on a win (the chapter's unlocks). */
  unlocks?: MoveId[];
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
  /** Moves to grant on a win. */
  unlocks: MoveId[];
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
    unlocks: [],
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
        unlocks: config.unlocks ?? [],
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

      // Bank the win: rewards, chapter progress + unlocks, and the WIN event.
      const concludeVictory = (playerFighter: Fighter, enemyFighter: Fighter): void => {
        const reward = resolveVictoryReward(state.difficulty, state.wager);
        const game = useGameStore.getState();
        game.addCoins(reward.coins);
        game.addXP(reward.xp);
        log.push(`${enemyFighter.name} is defeated! +${reward.coins} RC, +${reward.xp} XP.`);

        let notice: string | null = null;
        if (state.chapterId !== null && state.chapterId === game.currentChapter) {
          game.setChapter(state.chapterId + 1);
          if (state.unlocks.length > 0) {
            game.unlockMoves(state.unlocks);
            const names = state.unlocks.map((id) => MOVES[id].name).join(", ");
            log.push(`Unlocked: ${names}.`);
          }
          notice = `Chapter ${state.chapterId} cleared.`;
          log.push(notice);
        }

        actor.send({ type: "WIN" });
        set({ player: playerFighter, enemy: enemyFighter, log, reward, notice });
      };

      // 1) Player upkeep + move.
      const player = startTurn(state.player);
      const pOut = applyMove(player, state.enemy, moveId, rng);
      log.push(pOut.result.message);

      if (isDefeated(pOut.defender)) {
        concludeVictory(pOut.attacker, pOut.defender);
        return;
      }

      actor.send({ type: "PLAYER_ACTED" });

      // 2) Enemy upkeep + AI move.
      const enemy = startTurn(pOut.defender);
      const enemyMove = chooseEnemyMove(enemy, pOut.attacker, state.difficulty, rng);
      const eOut = applyMove(enemy, pOut.attacker, enemyMove, rng);
      log.push(eOut.result.message);

      let enemyFighter = eOut.attacker;
      let playerFighter = eOut.defender;

      if (isDefeated(playerFighter)) {
        log.push(`${playerFighter.name} has fallen. Defeat.`);
        if (state.wager > 0) log.push(`Wager of ${state.wager} RC forfeited.`);
        actor.send({ type: "LOSE" });
        set({ player: playerFighter, enemy: enemyFighter, log });
        return;
      }

      // 3) Counter: if the player braced and the enemy landed an attack, reflect.
      if (playerFighter.countering && eOut.result.hit && MOVES[enemyMove].kind === "attack") {
        const dmg = counterDamage(playerFighter, enemyFighter);
        enemyFighter = { ...enemyFighter, hp: Math.max(0, enemyFighter.hp - dmg) };
        playerFighter = { ...playerFighter, countering: false };
        log.push(`${playerFighter.name} counters for ${dmg}!`);
        if (isDefeated(enemyFighter)) {
          concludeVictory(playerFighter, enemyFighter);
          return;
        }
      }

      actor.send({ type: "ENEMY_ACTED" });
      set({ player: playerFighter, enemy: enemyFighter, log });
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
        unlocks: [],
        turn: 0,
      });
    },
  };
});
