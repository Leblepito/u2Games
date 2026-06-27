"use client";

import { create } from "zustand";
import { createActor } from "xstate";

import {
  applyMove,
  chooseEnemyMove,
  combatMachine,
  createFighter,
  isDefeated,
  MOVES,
  resolveVictoryReward,
  startTurn,
  type CombatPhase,
  type Difficulty,
  type Fighter,
  type MoveId,
  type Rng,
} from "@/features/combat";
import { useGameStore } from "@/lib/store";
import {
  applySyncEvent,
  highestSyncMove,
  partnerLomMultiplier,
  recordCoordination,
} from "../lib/lom";

export interface PartnerReward {
  coins: number;
  xp: number;
}

export interface StartPartnerBattleConfig {
  playerName?: string;
  difficulty?: Difficulty;
  player?: Partial<Fighter>;
  partner?: Partial<Fighter>;
  enemy?: Partial<Fighter>;
  /** Koh Sawan Keeper this fight resolves — marked defeated on a win. */
  keeperId?: string;
  rng?: Rng;
}

interface PartnerSlice {
  phase: CombatPhase;
  turn: number;
  difficulty: Difficulty;
  player: Fighter;
  partner: Fighter;
  enemy: Fighter;
  /** Lom partner sync, 0-100. */
  sync: number;
  /** Consecutive coordinated turns. */
  streak: number;
  /** Keeper this battle resolves, or null for a free bout. */
  keeperId: string | null;
  log: string[];
  reward: PartnerReward | null;
  startBattle: (config?: StartPartnerBattleConfig) => void;
  /** Both allies act on the enemy, then the enemy strikes back. */
  round: (playerMove: MoveId, partnerMove: MoveId) => void;
  /** Spend sync on the strongest available combo strike. */
  syncStrike: () => void;
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

function defaultPartner(over?: Partial<Fighter>): Fighter {
  // Yuki — small, fast, ice/water, fragile but surprisingly resilient (S2 bible).
  return createFighter({
    id: "partner",
    name: "Yuki",
    maxHp: 70,
    atk: 14,
    def: 6,
    speed: 16,
    lom: "water",
    ...over,
  });
}

function defaultEnemy(over?: Partial<Fighter>): Fighter {
  return createFighter({
    id: "enemy",
    name: "Keeper of Water",
    maxHp: 150,
    atk: 20,
    def: 10,
    speed: 10,
    lom: "water",
    ...over,
  });
}

/** Enemy focus-fires the lowest-HP living ally (ties favour the player). */
function pickTarget(player: Fighter, partner: Fighter): Fighter {
  const alive = [player, partner].filter((f) => f.hp > 0);
  return alive.reduce((a, b) => (b.hp < a.hp ? b : a));
}

export const usePartnerStore = create<PartnerSlice>((set, get) => {
  actor.subscribe((snapshot) => {
    set({
      phase: phaseOf(String(snapshot.value)),
      turn: snapshot.context.turn,
      difficulty: snapshot.context.difficulty,
    });
  });

  /** Run the enemy's retaliation against the lowest-HP ally; mutate-by-return. */
  function enemyTurn(
    player: Fighter,
    partner: Fighter,
    enemy: Fighter,
    sync: number,
    log: string[],
  ): { player: Fighter; partner: Fighter; enemy: Fighter; sync: number } {
    const e = startTurn(enemy);
    const target = pickTarget(player, partner);
    const move = chooseEnemyMove(e, target, get().difficulty, rng);
    const out = applyMove(e, target, move, rng);
    log.push(out.result.message);

    let nextPlayer = player;
    let nextPartner = partner;
    if (target.id === partner.id) {
      nextPartner = out.defender;
      if (out.result.hit && out.result.damage > 0) {
        sync = applySyncEvent(sync, "partner_damaged");
        log.push(`Yuki is hit — sync drops to ${sync}.`);
      }
    } else {
      nextPlayer = out.defender;
    }
    return { player: nextPlayer, partner: nextPartner, enemy: out.attacker, sync };
  }

  function concludeVictory(player: Fighter, partner: Fighter, enemy: Fighter, sync: number, log: string[]): void {
    const reward = resolveVictoryReward(get().difficulty, 0);
    const game = useGameStore.getState();
    game.addCoins(reward.coins);
    game.addXP(reward.xp);
    log.push(`${enemy.name} is defeated! +${reward.coins} RC, +${reward.xp} XP.`);
    const { keeperId } = get();
    if (keeperId) {
      game.defeatKeeper(keeperId);
      log.push(`${enemy.name} yields. The zone is cleared.`);
    }
    actor.send({ type: "WIN" });
    set({ player, partner, enemy, sync, log, reward: { coins: reward.coins, xp: reward.xp } });
  }

  function checkDefeat(player: Fighter, partner: Fighter): boolean {
    return isDefeated(player) && isDefeated(partner);
  }

  return {
    phase: "idle",
    turn: 0,
    difficulty: "normal",
    player: defaultPlayer(""),
    partner: defaultPartner(),
    enemy: defaultEnemy(),
    sync: 0,
    streak: 0,
    keeperId: null,
    log: [],
    reward: null,

    startBattle: (config = {}) => {
      const difficulty = config.difficulty ?? "normal";
      rng = config.rng ?? Math.random;
      const player = defaultPlayer(config.playerName ?? "", config.player);
      const partner = defaultPartner(config.partner);
      const enemy = defaultEnemy(config.enemy);

      actor.send({ type: "RESET" });
      actor.send({ type: "START", difficulty });
      set({
        player,
        partner,
        enemy,
        difficulty,
        sync: 0,
        streak: 0,
        keeperId: config.keeperId ?? null,
        reward: null,
        log: [`The Keeper stirs — ${player.name} & ${partner.name} vs ${enemy.name}!`],
      });
    },

    round: (playerMove, partnerMove) => {
      const state = get();
      if (state.phase !== "playerTurn") return;

      const log = [...state.log];

      // 1) Player acts if still standing.
      let enemy = state.enemy;
      let playerAfter = state.player;
      const playerActs = state.player.hp > 0;
      if (playerActs) {
        const player = startTurn(state.player);
        const pOut = applyMove(player, enemy, playerMove, rng);
        log.push(pOut.result.message);
        enemy = pOut.defender;
        playerAfter = pOut.attacker;
      }

      // 2) Partner acts if still standing.
      let partnerAfter = state.partner;
      const partnerActs = state.partner.hp > 0;
      if (partnerActs) {
        const partner = startTurn(state.partner);
        const ptOut = applyMove(partner, enemy, partnerMove, rng);
        log.push(ptOut.result.message);
        enemy = ptOut.defender;
        partnerAfter = ptOut.attacker;
      }

      // 3) Sync from coordination (both allies attacking the same element).
      const bothAttack =
        playerActs &&
        partnerActs &&
        MOVES[playerMove].kind === "attack" &&
        MOVES[partnerMove].kind === "attack";
      const coordinated = bothAttack && playerAfter.lom === partnerAfter.lom;
      const anyGuard =
        (playerActs && MOVES[playerMove].kind === "guard") ||
        (partnerActs && MOVES[partnerMove].kind === "guard");

      let sync = state.sync;
      if (coordinated) {
        sync = applySyncEvent(sync, "same_type_attack");
        log.push(`Coordinated ${playerAfter.lom} strike — sync ${sync}.`);
      }
      if (anyGuard) sync = applySyncEvent(sync, "protect_partner");
      const coord = recordCoordination({ sync, streak: state.streak }, coordinated);
      if (coord.sync !== sync && coordinated) log.push(`Three in sync — bonus! Sync ${coord.sync}.`);
      sync = coord.sync;

      if (isDefeated(enemy)) {
        concludeVictory(playerAfter, partnerAfter, enemy, sync, log);
        return;
      }

      // 4) Enemy retaliates.
      actor.send({ type: "PLAYER_ACTED" });
      const after = enemyTurn(playerAfter, partnerAfter, enemy, sync, log);

      if (checkDefeat(after.player, after.partner)) {
        log.push("Both roosters have fallen. Defeat.");
        actor.send({ type: "LOSE" });
        set({ player: after.player, partner: after.partner, enemy: after.enemy, sync: after.sync, streak: coord.streak, log });
        return;
      }

      actor.send({ type: "ENEMY_ACTED" });
      set({
        player: after.player,
        partner: after.partner,
        enemy: after.enemy,
        sync: after.sync,
        streak: coord.streak,
        log,
      });
    },

    syncStrike: () => {
      const state = get();
      if (state.phase !== "playerTurn") return;

      const move = highestSyncMove(state.sync);
      const log = [...state.log];
      if (!move) {
        log.push("Not enough sync for a combo strike.");
        set({ log });
        return;
      }

      const mult = partnerLomMultiplier(state.player.lom, state.enemy.lom, state.sync);
      const dmg = Math.max(
        1,
        Math.floor((state.player.atk + state.partner.atk) * move.damageMultiplier * mult - state.enemy.def),
      );
      const enemy = { ...state.enemy, hp: Math.max(0, state.enemy.hp - dmg) };
      const sync = Math.max(0, state.sync - move.requiredSync);
      log.push(`${move.name}! ${state.player.name} + ${state.partner.name} hit for ${dmg}. Sync ${sync}.`);

      if (isDefeated(enemy)) {
        concludeVictory(state.player, state.partner, enemy, sync, log);
        return;
      }

      actor.send({ type: "PLAYER_ACTED" });
      const after = enemyTurn(state.player, state.partner, enemy, sync, log);

      if (checkDefeat(after.player, after.partner)) {
        log.push("Both roosters have fallen. Defeat.");
        actor.send({ type: "LOSE" });
        set({ player: after.player, partner: after.partner, enemy: after.enemy, sync: after.sync, log });
        return;
      }

      actor.send({ type: "ENEMY_ACTED" });
      set({ player: after.player, partner: after.partner, enemy: after.enemy, sync: after.sync, log });
    },

    reset: () => {
      actor.send({ type: "RESET" });
      set({
        player: defaultPlayer(""),
        partner: defaultPartner(),
        enemy: defaultEnemy(),
        sync: 0,
        streak: 0,
        keeperId: null,
        log: [],
        reward: null,
        turn: 0,
      });
    },
  };
});
