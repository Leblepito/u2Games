import { MOVES, MOVE_IDS } from "./moves";
import type {
  ActionResult,
  Difficulty,
  Fighter,
  LomType,
  MoveId,
  Rng,
} from "./types";

/** Stamina recovered at the start of each fighter's turn. */
export const STAMINA_REGEN = 10;
export const CRIT_CHANCE = 0.1;
export const CRIT_MULTIPLIER = 1.5;

/** Lom advantage cycle: water > fire > wind > earth > water. Spirit is neutral. */
const LOM_ADVANTAGE: Record<LomType, LomType> = {
  water: "fire",
  fire: "wind",
  wind: "earth",
  earth: "water",
  spirit: "spirit",
};

/**
 * Element damage multiplier (docs/specs/lom-system.md):
 *   advantaged → 1.5×, disadvantaged → 0.7×, otherwise 1.0×.
 * Spirit is neutral to everything at base.
 */
export function lomMultiplier(attacker: LomType, defender: LomType): number {
  if (attacker === "spirit" || defender === "spirit") return 1.0;
  if (LOM_ADVANTAGE[attacker] === defender) return 1.5;
  if (LOM_ADVANTAGE[defender] === attacker) return 0.7;
  return 1.0;
}

const DEFAULT_FIGHTER: Omit<Fighter, "id" | "name"> = {
  maxHp: 100,
  hp: 100,
  maxStamina: 100,
  stamina: 100,
  atk: 20,
  def: 8,
  speed: 10,
  lom: "spirit",
  cooldowns: {},
  buffModifier: 0,
  damageReduction: 0,
  countering: false,
};

export function createFighter(
  init: Partial<Fighter> & Pick<Fighter, "id" | "name">,
): Fighter {
  return {
    ...DEFAULT_FIGHTER,
    ...init,
    // Keep hp/stamina in sync with provided maxima when not given explicitly.
    hp: init.hp ?? init.maxHp ?? DEFAULT_FIGHTER.maxHp,
    stamina: init.stamina ?? init.maxStamina ?? DEFAULT_FIGHTER.maxStamina,
    cooldowns: { ...(init.cooldowns ?? {}) },
  };
}

export function isDefeated(fighter: Fighter): boolean {
  return fighter.hp <= 0;
}

export function canUseMove(fighter: Fighter, moveId: MoveId): boolean {
  const move = MOVES[moveId];
  const cd = fighter.cooldowns[moveId] ?? 0;
  return cd === 0 && fighter.stamina >= move.staminaCost;
}

export function availableMoves(fighter: Fighter): MoveId[] {
  return MOVE_IDS.filter((id) => canUseMove(fighter, id));
}

/** Start-of-turn upkeep: regen stamina, tick cooldowns, drop the spent guard. */
export function startTurn(fighter: Fighter): Fighter {
  const cooldowns: Partial<Record<MoveId, number>> = {};
  for (const id of MOVE_IDS) {
    const cd = fighter.cooldowns[id] ?? 0;
    if (cd > 0) cooldowns[id] = cd - 1;
  }
  return {
    ...fighter,
    stamina: Math.min(fighter.maxStamina, fighter.stamina + STAMINA_REGEN),
    cooldowns,
    buffModifier: 0,
    damageReduction: 0,
    countering: false,
  };
}

interface DamageRoll {
  hit: boolean;
  critical: boolean;
  damage: number;
}

/**
 * Pure damage computation. Consumes the RNG in a fixed order:
 *   1) accuracy roll, 2) crit roll. Tests rely on this order.
 */
export function computeDamage(
  attacker: Fighter,
  defender: Fighter,
  moveId: MoveId,
  rng: Rng,
): DamageRoll {
  const move = MOVES[moveId];
  // Only attack moves deal immediate damage; guard/heal/counter never do.
  if (move.kind !== "attack" || move.damageMultiplier === 0) {
    return { hit: true, critical: false, damage: 0 };
  }

  const hit = rng() < move.accuracy;
  if (!hit) return { hit: false, critical: false, damage: 0 };

  const base = attacker.atk * move.damageMultiplier;
  const elementBonus = lomMultiplier(attacker.lom, defender.lom);
  const defense = defender.def * (1 + defender.buffModifier);
  let finalDamage = Math.max(1, Math.floor(base * elementBonus - defense));

  // Shield: flat reduction of the next incoming hit.
  if (defender.damageReduction > 0) {
    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - defender.damageReduction)));
  }

  const critical = rng() < CRIT_CHANCE;
  if (critical) finalDamage = Math.floor(finalDamage * CRIT_MULTIPLIER);

  return { hit: true, critical, damage: finalDamage };
}

export interface MoveOutcome {
  attacker: Fighter;
  defender: Fighter;
  result: ActionResult;
}

/**
 * Resolve a single move. Returns new immutable fighter states plus a log entry.
 * - Attack moves spend stamina, set cooldown, and damage the defender (whose
 *   one-shot guard buff / shield is consumed).
 * - Guard moves brace the attacker (DEF up and/or next-hit reduction).
 * - Heal restores a fraction of the attacker's max HP.
 * - Counter braces the attacker to reflect the next incoming attack (resolved
 *   by the caller, who knows whether the opponent then attacks).
 * Non-attack moves leave the defender untouched.
 */
export function applyMove(
  attacker: Fighter,
  defender: Fighter,
  moveId: MoveId,
  rng: Rng,
): MoveOutcome {
  const move = MOVES[moveId];
  const roll = computeDamage(attacker, defender, moveId, rng);

  const healAmount =
    move.kind === "heal" ? Math.floor(attacker.maxHp * (move.healPercent ?? 0)) : 0;

  const nextAttacker: Fighter = {
    ...attacker,
    hp: Math.min(attacker.maxHp, attacker.hp + healAmount),
    stamina: Math.max(0, attacker.stamina - move.staminaCost),
    cooldowns: { ...attacker.cooldowns, [moveId]: move.cooldown },
    buffModifier:
      move.kind === "guard" ? (move.guardBuff ?? 0) : attacker.buffModifier,
    damageReduction:
      move.kind === "guard" ? (move.block ?? 0) : attacker.damageReduction,
    countering: move.kind === "counter" ? true : attacker.countering,
  };

  let nextDefender = defender;
  let message: string;

  if (move.kind === "heal") {
    message = `${attacker.name} uses ${move.name}, recovering ${healAmount} HP.`;
  } else if (move.kind === "counter") {
    message = `${attacker.name} uses ${move.name}, bracing to counter.`;
  } else if (move.kind === "guard") {
    message = move.block
      ? `${attacker.name} raises a ${move.name} — next hit reduced.`
      : `${attacker.name} uses ${move.name} — DEF up for the next hit.`;
  } else if (!roll.hit) {
    message = `${attacker.name} uses ${move.name} but misses!`;
  } else {
    nextDefender = {
      ...defender,
      hp: Math.max(0, defender.hp - roll.damage),
      buffModifier: 0, // brace consumed by this hit
      damageReduction: 0, // shield consumed by this hit
    };
    message = roll.critical
      ? `${attacker.name} lands a CRITICAL ${move.name} for ${roll.damage}!`
      : `${attacker.name} hits ${move.name} for ${roll.damage}.`;
  }

  return {
    attacker: nextAttacker,
    defender: nextDefender,
    result: {
      attackerId: attacker.id,
      defenderId: defender.id,
      moveId,
      hit: roll.hit,
      critical: roll.critical,
      damage: roll.damage,
      message,
    },
  };
}

/**
 * Reflected damage when a braced fighter (Counter) is hit by an attack. Uses
 * the counter move's multiplier against the attacker's ATK/DEF/lom.
 */
export function counterDamage(counterer: Fighter, attacker: Fighter): number {
  const base = counterer.atk * MOVES.counter.damageMultiplier;
  const bonus = lomMultiplier(counterer.lom, attacker.lom);
  return Math.max(1, Math.floor(base * bonus - attacker.def));
}

/** Moves the enemy AI is allowed to use — the classic S1 set. The advanced
 * unlockables (counter/heal/shield) are player-progression tools and would
 * need reactive handling the simple AI doesn't model, so bosses skip them. */
const AI_MOVE_IDS: readonly MoveId[] = [
  "peck",
  "wing_strike",
  "heavy_kick",
  "dodge",
  "taunt",
  "fury",
];

/** Expected damage of an attack move, used by the AI to rank options. */
function expectedDamage(self: Fighter, opponent: Fighter, moveId: MoveId): number {
  const move = MOVES[moveId];
  if (move.kind !== "attack") return 0;
  const base = self.atk * move.damageMultiplier;
  const bonus = lomMultiplier(self.lom, opponent.lom);
  const raw = base * bonus - opponent.def * (1 + opponent.buffModifier);
  return Math.max(1, raw) * move.accuracy;
}

/**
 * Pick the enemy's move for the turn (docs/specs/combat-system.md "AI Difficulty"):
 *   easy   → 60% random, 40% best move
 *   normal → always best expected-damage move
 *   hard   → guard when low HP, burst when the player is stamina-starved,
 *            otherwise best move.
 * Always returns a move the fighter can actually afford this turn.
 */
export function chooseEnemyMove(
  self: Fighter,
  opponent: Fighter,
  difficulty: Difficulty,
  rng: Rng,
): MoveId {
  const options = availableMoves(self).filter((id) => AI_MOVE_IDS.includes(id));
  if (options.length === 0) return "peck"; // regen guarantees this is affordable next turn
  if (options.length === 1) return options[0];

  const attacks = options.filter((id) => MOVES[id].kind === "attack");
  const best = (ids: MoveId[]): MoveId =>
    ids.reduce((a, b) =>
      expectedDamage(self, opponent, b) > expectedDamage(self, opponent, a)
        ? b
        : a,
    );

  if (difficulty === "easy") {
    if (rng() < 0.6) return options[Math.floor(rng() * options.length)];
    return attacks.length ? best(attacks) : options[0];
  }

  if (difficulty === "hard") {
    const lowHp = self.hp / self.maxHp < 0.3;
    if (lowHp && options.includes("dodge")) return "dodge";
    const burst = attacks.filter((id) => id === "fury" || id === "heavy_kick");
    if (opponent.stamina < 15 && burst.length) return best(burst);
  }

  return attacks.length ? best(attacks) : options[0];
}
