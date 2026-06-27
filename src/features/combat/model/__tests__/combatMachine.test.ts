import { describe, it, expect } from "vitest";
import { createActor } from "xstate";

import { combatMachine } from "../combatMachine";

describe("combatMachine", () => {
  it("walks idle → playerTurn → enemyTurn → playerTurn, tracking turns", () => {
    const actor = createActor(combatMachine).start();
    expect(actor.getSnapshot().value).toBe("idle");

    actor.send({ type: "START", difficulty: "normal" });
    expect(actor.getSnapshot().value).toBe("playerTurn");
    expect(actor.getSnapshot().context.turn).toBe(1);

    actor.send({ type: "PLAYER_ACTED" });
    expect(actor.getSnapshot().value).toBe("enemyTurn");

    actor.send({ type: "ENEMY_ACTED" });
    expect(actor.getSnapshot().value).toBe("playerTurn");
    expect(actor.getSnapshot().context.turn).toBe(2);
  });

  it("reaches victory on WIN and resets to idle", () => {
    const actor = createActor(combatMachine).start();
    actor.send({ type: "START", difficulty: "easy" });
    actor.send({ type: "WIN" });
    expect(actor.getSnapshot().value).toBe("victory");
    expect(actor.getSnapshot().context.winner).toBe("player");

    actor.send({ type: "RESET" });
    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.winner).toBeNull();
  });

  it("reaches defeat on LOSE from the enemy turn", () => {
    const actor = createActor(combatMachine).start();
    actor.send({ type: "START", difficulty: "hard" });
    actor.send({ type: "PLAYER_ACTED" });
    actor.send({ type: "LOSE" });
    expect(actor.getSnapshot().value).toBe("defeat");
    expect(actor.getSnapshot().context.winner).toBe("enemy");
  });
});
