import { describe, it, expect } from "vitest";

import { KEEPERS, getKeeper, keeperStatus } from "../island";

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
