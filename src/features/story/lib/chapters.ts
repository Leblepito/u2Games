/**
 * Season 1 chapter data — Act 1–2 spine (Ch0–4).
 *
 * Boss stats scale off the default player fighter (maxHp 100 / atk 22 / def 9).
 * Mapping mirrors docs/gdd/story-bible-s1.md "Chapter → Region → Boss → Trading"
 * table. Ch5–12 land in a later content pass.
 */

import type { Chapter, ChapterStatus } from "./types";

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 0,
    act: 1,
    title: "The Hatchling",
    region: "Kanchanaburi, Thailand",
    intro: "The cursed egg hatches. Pa Noi teaches you the basics against his old bird.",
    boss: {
      name: "Old Crow",
      difficulty: "easy",
      fighter: { name: "Old Crow", maxHp: 80, atk: 16, def: 6, speed: 8, lom: "wind" },
    },
    tradingLesson: "Paper Trading",
    unlocks: ["peck", "wing_strike", "dodge"],
  },
  {
    id: 1,
    act: 1,
    title: "The Patient Warrior",
    region: "Bangkok, Thailand",
    intro: "Khun Wichai's arena. Your first taste of the Syndicate — and of Kai.",
    boss: {
      name: "Jaoreua Rop Jr.",
      difficulty: "normal",
      fighter: { name: "Jaoreua Rop Jr.", maxHp: 95, atk: 19, def: 7, speed: 10, lom: "fire" },
    },
    tradingLesson: "Position Sizing",
    unlocks: ["heavy_kick"],
  },
  {
    id: 2,
    act: 1,
    title: "The Temple of Balance",
    region: "Bali, Indonesia",
    intro: "I Wayan Dharma reveals Naresuan's Spirit. The golden aura stirs.",
    boss: {
      name: "Sang Bhuta",
      difficulty: "normal",
      fighter: { name: "Sang Bhuta", maxHp: 100, atk: 20, def: 8, speed: 11, lom: "spirit" },
    },
    tradingLesson: "Fear & Greed",
    unlocks: ["taunt"],
  },
  {
    id: 3,
    act: 2,
    title: "The Kristo's Gambit",
    region: "Manila, Philippines",
    intro: "The Crown Tournament. Mang Cardo teaches you to read the crowd.",
    boss: {
      name: "El Supremo",
      difficulty: "hard",
      fighter: { name: "El Supremo", maxHp: 120, atk: 24, def: 10, speed: 12, lom: "earth" },
    },
    tradingLesson: "Order Flow",
    unlocks: ["fury"],
  },
  {
    id: 4,
    act: 2,
    title: "The Valley of Shadows",
    region: "Ayutthaya, Thailand",
    intro: "The final vs Kai. Your grandfather's last lesson, written in the wind.",
    boss: {
      name: "Naresuan's Spirit",
      difficulty: "hard",
      fighter: { name: "Naresuan's Spirit", maxHp: 140, atk: 26, def: 12, speed: 13, lom: "spirit" },
    },
    tradingLesson: "Trading Philosophy",
    unlocks: [],
  },
] as const;

/** The highest chapter id the campaign currently ships. */
export const LAST_CHAPTER_ID = CHAPTERS[CHAPTERS.length - 1].id;

export function getChapter(id: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/**
 * Linear progression: chapters below the player's current chapter are done,
 * the current one is playable, everything above is locked.
 */
export function chapterStatus(id: number, currentChapter: number): ChapterStatus {
  if (id < currentChapter) return "completed";
  if (id === currentChapter) return "active";
  return "locked";
}
