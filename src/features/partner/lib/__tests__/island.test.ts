import { describe, it, expect } from "vitest";

import { KEEPERS, getKeeper, keeperResist, keeperStatus } from "../island";

describe("KEEPERS data", () => {
  it("has the five elemental Keepers with matching lom + chapters", () => {
    expect(KEEPERS.map((k) => k.id)).toEqual(["water", "earth", "fire", "wind", "spirit"]);
    for (const k of KEEPERS) {
      expect(k.fighter.lom).toBe(k.id); // KeeperId doubles as its element
      expect(k.chapterId).toBeGreaterThanOrEqual(13);
      expect(k.philosophy.length).toBeGreaterThan(0);
    }
  });

  it("uses only engine-supported difficulties", () => {
    const allowed = new Set(["easy", "normal", "hard"]);
    for (const k of KEEPERS) expect(allowed.has(k.difficulty)).toBe(true);
  });
});

describe("getKeeper", () => {
  it("finds by id and misses cleanly", () => {
    expect(getKeeper("fire")?.zone).toBe("Ember Peak");
    expect(getKeeper("nope")).toBeUndefined();
  });
});

describe("keeperStatus", () => {
  it("the first undefeated Keeper is active, the rest locked", () => {
    expect(keeperStatus("water", [])).toBe("active");
    expect(keeperStatus("earth", [])).toBe("locked");
  });

  it("defeated Keepers read as cleared and unlock the next", () => {
    expect(keeperStatus("water", ["water"])).toBe("defeated");
    expect(keeperStatus("earth", ["water"])).toBe("active");
    expect(keeperStatus("fire", ["water"])).toBe("locked");
  });
});

describe("keeperResist", () => {
  it("spirit shrugs off normal hits but takes full sync damage", () => {
    expect(keeperResist("spirit", 80, { moveId: "peck", isSync: false })).toBe(1);
    expect(keeperResist("spirit", 80, { isSync: true })).toBe(80);
  });

  it("earth caps every hit, sync included", () => {
    expect(keeperResist("earth", 80, { moveId: "fury", isSync: false })).toBe(25);
    expect(keeperResist("earth", 80, { isSync: true })).toBe(25);
    expect(keeperResist("earth", 10, { moveId: "peck", isSync: false })).toBe(10);
  });

  it("fire punishes rage (Fury) to half", () => {
    expect(keeperResist("fire", 80, { moveId: "fury", isSync: false })).toBe(40);
    expect(keeperResist("fire", 80, { moveId: "peck", isSync: false })).toBe(80);
  });

  it("wind / water soften raw hits but yield to sync", () => {
    expect(keeperResist("wind", 100, { moveId: "peck", isSync: false })).toBe(60);
    expect(keeperResist("wind", 100, { isSync: true })).toBe(100);
    expect(keeperResist("water", 100, { moveId: "peck", isSync: false })).toBe(70);
  });

  it("a free bout (no keeper) takes full damage", () => {
    expect(keeperResist(null, 80, { moveId: "peck", isSync: false })).toBe(80);
  });
});
