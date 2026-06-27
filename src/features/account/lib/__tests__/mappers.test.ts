import { describe, it, expect } from "vitest";

import {
  completedChapters,
  mergeSnapshots,
  rowsToSnapshot,
  snapshotToStoryRow,
  snapshotToUserRow,
  type ProfileSnapshot,
  type RvUserRow,
} from "../mappers";

const SNAP: ProfileSnapshot = {
  playerName: "Arun",
  roosterCoins: 300,
  xp: 250,
  level: 3,
  currentChapter: 2,
  season: 1,
  unlockedMoves: ["peck", "wing_strike", "dodge", "heavy_kick"],
};

describe("completedChapters", () => {
  it("lists every chapter below the current one", () => {
    expect(completedChapters(0)).toEqual([]);
    expect(completedChapters(3)).toEqual([0, 1, 2]);
    expect(completedChapters(-5)).toEqual([]);
  });
});

describe("snapshot → rows", () => {
  it("maps the user row, nulling an empty name", () => {
    expect(snapshotToUserRow("u1", SNAP)).toEqual({
      id: "u1",
      display_name: "Arun",
      rooster_coins: 300,
      xp: 250,
      level: 3,
      current_chapter: 2,
      current_season: 1,
    });
    expect(snapshotToUserRow("u1", { ...SNAP, playerName: "" }).display_name).toBeNull();
  });

  it("maps the story row with derived completed chapters", () => {
    expect(snapshotToStoryRow("u1", SNAP)).toEqual({
      user_id: "u1",
      season: 1,
      completed_chapters: [0, 1],
      unlocked_moves: SNAP.unlockedMoves,
    });
  });
});

describe("rowsToSnapshot", () => {
  it("rebuilds a snapshot, tolerating a missing story row", () => {
    const user: RvUserRow = {
      id: "u1",
      display_name: "Kai",
      rooster_coins: 99,
      xp: 120,
      level: 2,
      current_chapter: 1,
      current_season: 2,
    };
    expect(rowsToSnapshot(user, null)).toEqual({
      playerName: "Kai",
      roosterCoins: 99,
      xp: 120,
      level: 2,
      currentChapter: 1,
      season: 2,
      unlockedMoves: [],
    });
  });
});

describe("mergeSnapshots", () => {
  it("takes the max of progress and the union of moves (lossless)", () => {
    const local: ProfileSnapshot = { ...SNAP, roosterCoins: 300, currentChapter: 2, unlockedMoves: ["peck"] };
    const remote: ProfileSnapshot = {
      playerName: "",
      roosterCoins: 150,
      xp: 999,
      level: 1,
      currentChapter: 4,
      season: 1,
      unlockedMoves: ["fury"],
    };
    const merged = mergeSnapshots(local, remote);
    expect(merged.roosterCoins).toBe(300); // local higher
    expect(merged.xp).toBe(999); // remote higher
    expect(merged.currentChapter).toBe(4); // remote higher
    expect(merged.playerName).toBe("Arun"); // non-empty local wins
    expect(merged.unlockedMoves.sort()).toEqual(["fury", "peck"]);
  });

  it("is order-independent", () => {
    const a: ProfileSnapshot = { ...SNAP };
    const b: ProfileSnapshot = { ...SNAP, roosterCoins: 5, xp: 9000, unlockedMoves: ["taunt"] };
    expect(mergeSnapshots(a, b)).toEqual(mergeSnapshots(b, a));
  });
});
