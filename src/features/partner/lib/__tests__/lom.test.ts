import { describe, it, expect } from "vitest";

import {
  SYNC_MOVES,
  applySyncEvent,
  highestSyncMove,
  partnerLomMultiplier,
  recordCoordination,
  spiritAmplify,
  unlockedSyncMoves,
} from "../lom";

describe("applySyncEvent", () => {
  it("applies each event delta", () => {
    expect(applySyncEvent(50, "same_type_attack")).toBe(60);
    expect(applySyncEvent(50, "protect_partner")).toBe(65);
    expect(applySyncEvent(50, "triple_coordinated")).toBe(70);
    expect(applySyncEvent(50, "partner_damaged")).toBe(45);
  });

  it("clamps to [0, 100]", () => {
    expect(applySyncEvent(95, "triple_coordinated")).toBe(100);
    expect(applySyncEvent(2, "partner_damaged")).toBe(0);
  });
});

describe("sync moves", () => {
  it("unlocks moves as sync crosses thresholds", () => {
    expect(unlockedSyncMoves(0)).toEqual([]);
    expect(unlockedSyncMoves(29)).toEqual([]);
    expect(unlockedSyncMoves(30).map((m) => m.id)).toEqual(["basic_combo"]);
    expect(unlockedSyncMoves(60).map((m) => m.id)).toEqual(["basic_combo", "dual_strike"]);
    expect(unlockedSyncMoves(100)).toHaveLength(SYNC_MOVES.length);
  });

  it("highestSyncMove returns the strongest available or null", () => {
    expect(highestSyncMove(10)).toBeNull();
    expect(highestSyncMove(30)?.id).toBe("basic_combo");
    expect(highestSyncMove(90)?.id).toBe("golden_flame");
  });
});

describe("spiritAmplify", () => {
  it("steps up with sync, capping at 1.8", () => {
    expect(spiritAmplify(0)).toBe(1.0);
    expect(spiritAmplify(30)).toBe(1.2);
    expect(spiritAmplify(60)).toBe(1.4);
    expect(spiritAmplify(90)).toBe(1.8);
    expect(spiritAmplify(100)).toBe(1.8);
  });
});

describe("partnerLomMultiplier", () => {
  it("uses the element cycle for non-spirit attackers (sync-independent)", () => {
    expect(partnerLomMultiplier("water", "fire", 0)).toBe(1.5);
    expect(partnerLomMultiplier("fire", "water", 99)).toBe(0.7);
  });

  it("amplifies a spirit attacker by sync instead", () => {
    expect(partnerLomMultiplier("spirit", "fire", 0)).toBe(1.0);
    expect(partnerLomMultiplier("spirit", "fire", 90)).toBe(1.8);
  });
});

describe("recordCoordination", () => {
  it("awards the +20 bonus on the third consecutive coordinated turn and resets", () => {
    let s = { sync: 0, streak: 0 };
    s = recordCoordination(s, true); // streak 1
    s = recordCoordination(s, true); // streak 2
    expect(s.sync).toBe(0);
    s = recordCoordination(s, true); // streak 3 -> +20, reset
    expect(s.sync).toBe(20);
    expect(s.streak).toBe(0);
  });

  it("resets the streak when a turn is uncoordinated", () => {
    let s = { sync: 10, streak: 2 };
    s = recordCoordination(s, false);
    expect(s.streak).toBe(0);
    expect(s.sync).toBe(10); // unchanged
  });
});
