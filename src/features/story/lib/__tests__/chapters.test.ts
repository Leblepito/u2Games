import { describe, it, expect } from "vitest";

import { MOVE_IDS } from "@/features/combat";
import { CHAPTERS, LAST_CHAPTER_ID, getChapter, chapterStatus } from "../chapters";

describe("CHAPTERS data", () => {
  it("is a contiguous 0-based chain", () => {
    CHAPTERS.forEach((c, i) => expect(c.id).toBe(i));
    expect(LAST_CHAPTER_ID).toBe(CHAPTERS.length - 1);
  });

  it("covers the full Season 1 arc (Ch0-12, Acts 1-4)", () => {
    expect(CHAPTERS).toHaveLength(13);
    expect(LAST_CHAPTER_ID).toBe(12);
    expect(new Set(CHAPTERS.map((c) => c.act))).toEqual(new Set([1, 2, 3, 4]));
  });

  it("uses only engine-supported difficulties", () => {
    const allowed = new Set(["easy", "normal", "hard"]);
    for (const c of CHAPTERS) expect(allowed.has(c.boss.difficulty)).toBe(true);
  });

  it("only unlocks moves the combat engine knows", () => {
    for (const c of CHAPTERS) {
      for (const move of c.unlocks) {
        expect(MOVE_IDS).toContain(move);
      }
    }
  });

  it("gives every chapter a named boss and a trading lesson", () => {
    for (const c of CHAPTERS) {
      expect(c.boss.name.length).toBeGreaterThan(0);
      expect(c.boss.fighter.name).toBe(c.boss.name);
      expect(c.tradingLesson.length).toBeGreaterThan(0);
    }
  });
});

describe("getChapter", () => {
  it("finds a chapter by id and misses cleanly", () => {
    expect(getChapter(0)?.title).toBe("The Hatchling");
    expect(getChapter(999)).toBeUndefined();
  });
});

describe("chapterStatus", () => {
  it("classifies past / current / future chapters", () => {
    // Player is on chapter 2.
    expect(chapterStatus(1, 2)).toBe("completed");
    expect(chapterStatus(2, 2)).toBe("active");
    expect(chapterStatus(3, 2)).toBe("locked");
  });

  it("treats a fresh save (chapter 0) correctly", () => {
    expect(chapterStatus(0, 0)).toBe("active");
    expect(chapterStatus(1, 0)).toBe("locked");
  });
});
