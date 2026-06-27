import { describe, it, expect } from "vitest";

import {
  applyMove,
  availableMoves,
  canUseMove,
  chooseEnemyMove,
  computeDamage,
  counterDamage,
  createFighter,
  isDefeated,
  lomMultiplier,
  startTurn,
  STAMINA_REGEN,
} from "../combatEngine";
import type { Fighter, Rng } from "../types";

/** RNG that yields a fixed sequence, then repeats the last value. */
function seqRng(values: number[]): Rng {
  let i = 0;
  return () => (i < values.length ? values[i++] : (values[values.length - 1] ?? 0));
}

function fighter(over: Partial<Fighter> = {}): Fighter {
  return createFighter({ id: "f", name: "Test", atk: 20, def: 8, ...over });
}

describe("lomMultiplier", () => {
  it("advantaged matchup is 1.5×", () => {
    expect(lomMultiplier("water", "fire")).toBe(1.5);
    expect(lomMultiplier("fire", "wind")).toBe(1.5);
    expect(lomMultiplier("earth", "water")).toBe(1.5);
  });

  it("disadvantaged matchup is 0.7×", () => {
    expect(lomMultiplier("fire", "water")).toBe(0.7);
    expect(lomMultiplier("water", "earth")).toBe(0.7);
  });

  it("same type and spirit are neutral 1.0×", () => {
    expect(lomMultiplier("water", "water")).toBe(1.0);
    expect(lomMultiplier("spirit", "fire")).toBe(1.0);
    expect(lomMultiplier("fire", "spirit")).toBe(1.0);
  });
});

describe("computeDamage", () => {
  it("hits and applies the move multiplier minus defense", () => {
    // peck: 20 * 0.6 = 12 base, -8 def = 4
    const roll = computeDamage(fighter(), fighter(), "peck", seqRng([0.0, 0.99]));
    expect(roll).toEqual({ hit: true, critical: false, damage: 4 });
  });

  it("misses when the accuracy roll fails", () => {
    const roll = computeDamage(fighter(), fighter(), "peck", seqRng([0.99]));
    expect(roll.hit).toBe(false);
    expect(roll.damage).toBe(0);
  });

  it("crits for 1.5× when the crit roll passes", () => {
    // base 4, crit -> floor(4 * 1.5) = 6
    const roll = computeDamage(fighter(), fighter(), "peck", seqRng([0.0, 0.0]));
    expect(roll).toEqual({ hit: true, critical: true, damage: 6 });
  });

  it("floors damage to a minimum of 1", () => {
    const weak = fighter({ atk: 1 });
    const roll = computeDamage(weak, fighter(), "peck", seqRng([0.0, 0.99]));
    expect(roll.damage).toBe(1);
  });

  it("applies the lom advantage bonus", () => {
    // water atk 20 * 0.6 = 12, *1.5 lom = 18, -8 def = 10
    const w = fighter({ lom: "water" });
    const f = fighter({ lom: "fire" });
    const roll = computeDamage(w, f, "peck", seqRng([0.0, 0.99]));
    expect(roll.damage).toBe(10);
  });

  it("guard moves deal no damage", () => {
    const roll = computeDamage(fighter(), fighter(), "dodge", seqRng([0.0]));
    expect(roll.damage).toBe(0);
  });
});

describe("affordability + cooldown", () => {
  it("blocks moves the fighter can't pay for", () => {
    expect(canUseMove(fighter({ stamina: 5 }), "fury")).toBe(false);
    expect(canUseMove(fighter({ stamina: 5 }), "taunt")).toBe(true);
  });

  it("blocks moves on cooldown", () => {
    expect(canUseMove(fighter({ cooldowns: { heavy_kick: 2 } }), "heavy_kick")).toBe(false);
  });

  it("availableMoves reflects stamina + cooldown", () => {
    const f = fighter({ stamina: 8, cooldowns: { peck: 0 } });
    const moves = availableMoves(f);
    expect(moves).toContain("peck"); // 8 stamina
    expect(moves).toContain("taunt"); // 5 stamina
    expect(moves).not.toContain("fury"); // 40 stamina
  });
});

describe("startTurn", () => {
  it("regens stamina (capped), ticks cooldowns, clears the guard", () => {
    const f = fighter({
      maxStamina: 100,
      stamina: 95,
      cooldowns: { fury: 2, peck: 0 },
      buffModifier: 1.0,
    });
    const next = startTurn(f);
    expect(next.stamina).toBe(100); // capped, not 105
    expect(next.cooldowns.fury).toBe(1);
    expect(next.cooldowns.peck).toBeUndefined();
    expect(next.buffModifier).toBe(0);
  });

  it("adds exactly STAMINA_REGEN when below cap", () => {
    const next = startTurn(fighter({ maxStamina: 100, stamina: 50 }));
    expect(next.stamina).toBe(50 + STAMINA_REGEN);
  });
});

describe("applyMove", () => {
  it("damages the defender and sets attacker cost + cooldown", () => {
    const a = fighter({ id: "a", name: "A", stamina: 50 });
    const d = fighter({ id: "d", name: "D", hp: 100 });
    const out = applyMove(a, d, "heavy_kick", seqRng([0.0, 0.99]));
    // 20 * 1.8 = 36, -8 = 28
    expect(out.defender.hp).toBe(72);
    expect(out.attacker.stamina).toBe(25); // 50 - 25
    expect(out.attacker.cooldowns.heavy_kick).toBe(2);
    expect(out.result.damage).toBe(28);
    expect(out.result.hit).toBe(true);
  });

  it("guard braces the attacker and leaves the defender untouched", () => {
    const a = fighter({ id: "a", name: "A" });
    const d = fighter({ id: "d", name: "D", hp: 100 });
    const out = applyMove(a, d, "dodge", seqRng([0.0]));
    expect(out.attacker.buffModifier).toBe(1.0);
    expect(out.defender.hp).toBe(100);
    expect(out.result.damage).toBe(0);
  });

  it("the guard buff reduces the next incoming hit, then is consumed", () => {
    const braced = fighter({ id: "d", name: "D", buffModifier: 1.0 });
    const attacker = fighter({ id: "a", name: "A" });
    // peck base 12, defense 8*(1+1)=16 -> max(1, 12-16)=1
    const out = applyMove(attacker, braced, "peck", seqRng([0.0, 0.99]));
    expect(out.result.damage).toBe(1);
    expect(out.defender.buffModifier).toBe(0); // consumed
  });
});

describe("advanced moves (heal / shield / counter)", () => {
  it("heal restores a fraction of max HP and leaves the defender alone", () => {
    const a = fighter({ id: "a", name: "A", hp: 50, maxHp: 100, stamina: 100 });
    const d = fighter({ id: "d", name: "D", hp: 100 });
    const out = applyMove(a, d, "heal", seqRng([0]));
    expect(out.attacker.hp).toBe(70); // 50 + 20% of 100
    expect(out.attacker.stamina).toBe(70); // 100 - 30
    expect(out.defender.hp).toBe(100);
    expect(out.result.damage).toBe(0);
  });

  it("heal never overheals past max HP", () => {
    const a = fighter({ hp: 95, maxHp: 100 });
    expect(applyMove(a, fighter(), "heal", seqRng([0])).attacker.hp).toBe(100);
  });

  it("shield braces the attacker with a damage reduction", () => {
    const out = applyMove(fighter({ id: "a", name: "A" }), fighter({ id: "d", name: "D" }), "shield", seqRng([0]));
    expect(out.attacker.damageReduction).toBe(0.5);
    expect(out.attacker.buffModifier).toBe(0);
    expect(out.result.damage).toBe(0);
  });

  it("damageReduction halves the next incoming hit", () => {
    // peck base 12 - 8 def = 4, then *0.5 shield = 2
    const shielded = fighter({ damageReduction: 0.5 });
    const roll = computeDamage(fighter(), shielded, "peck", seqRng([0.0, 0.99]));
    expect(roll.damage).toBe(2);
  });

  it("counter braces the attacker (no immediate damage)", () => {
    const out = applyMove(fighter({ id: "a", name: "A" }), fighter({ id: "d", name: "D", hp: 100 }), "counter", seqRng([0]));
    expect(out.attacker.countering).toBe(true);
    expect(out.defender.hp).toBe(100);
    expect(out.result.damage).toBe(0);
  });

  it("counterDamage reflects 1.2x ATK minus the attacker's DEF", () => {
    // 20 * 1.2 = 24, - 8 def = 16
    expect(counterDamage(fighter({ atk: 20 }), fighter({ def: 8 }))).toBe(16);
  });

  it("the enemy AI never picks the advanced unlockable moves", () => {
    const rich = fighter({ id: "e", name: "E", stamina: 100 });
    const opp = fighter({ id: "p", name: "P", stamina: 100 });
    for (const diff of ["easy", "normal", "hard"] as const) {
      for (let r = 0; r < 1; r += 0.05) {
        const move = chooseEnemyMove(rich, opp, diff, seqRng([r, r]));
        expect(["counter", "heal", "shield"]).not.toContain(move);
      }
    }
  });
});

describe("isDefeated", () => {
  it("is true at 0 HP", () => {
    expect(isDefeated(fighter({ hp: 0 }))).toBe(true);
    expect(isDefeated(fighter({ hp: 1 }))).toBe(false);
  });
});

describe("chooseEnemyMove", () => {
  const self = fighter({ id: "e", name: "Enemy", stamina: 100 });
  const opp = fighter({ id: "p", name: "Player", stamina: 100 });

  it("always returns an affordable, ready move", () => {
    for (const diff of ["easy", "normal", "hard"] as const) {
      const move = chooseEnemyMove(self, opp, diff, seqRng([0.5, 0.5]));
      expect(canUseMove(self, move)).toBe(true);
    }
  });

  it("normal picks the highest expected-damage move", () => {
    // fury (2.5×, 0.55 acc) out-expects the rest at full stamina
    const move = chooseEnemyMove(self, opp, "normal", seqRng([0.5]));
    expect(move).toBe("fury");
  });

  it("easy can pick a random move on a low roll", () => {
    // rng 0.0 -> random branch; index floor(0.0 * n) = 0 -> first MOVE_ID = "peck"
    const move = chooseEnemyMove(self, opp, "easy", seqRng([0.0, 0.0]));
    expect(move).toBe("peck");
  });

  it("hard guards when its own HP is low", () => {
    const hurt = fighter({ id: "e", name: "Enemy", hp: 10, maxHp: 100, stamina: 100 });
    const move = chooseEnemyMove(hurt, opp, "hard", seqRng([0.5]));
    expect(move).toBe("dodge");
  });
});

describe("full battle loop", () => {
  it("ends when a fighter reaches 0 HP", () => {
    let player = fighter({ id: "p", name: "Player", hp: 60, atk: 30, stamina: 100 });
    let enemy = fighter({ id: "e", name: "Enemy", hp: 40, atk: 10, def: 4, stamina: 100 });
    const rng = seqRng([0.5]); // 0.5 < 0.85 acc -> always hits; 0.5 >= 0.1 -> never crits

    let guard = 0;
    while (!isDefeated(enemy) && guard < 50) {
      player = startTurn(player);
      const out = applyMove(player, enemy, "wing_strike", rng);
      player = out.attacker;
      enemy = out.defender;
      guard++;
    }

    expect(isDefeated(enemy)).toBe(true);
    expect(guard).toBeLessThan(50);
  });
});
