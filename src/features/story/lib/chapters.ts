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
  {
    id: 5,
    act: 2,
    title: "The Broken Bond",
    region: "Bangkok Underground",
    intro: "Kai is gone. Wichai rebuilds you — strength, but not Kai's way.",
    boss: {
      name: "Steel Wing",
      difficulty: "hard",
      fighter: { name: "Steel Wing", maxHp: 150, atk: 27, def: 13, speed: 12, lom: "earth" },
    },
    tradingLesson: "Risk Management",
    unlocks: [],
  },
  {
    id: 6,
    act: 3,
    title: "The Monsoon's Wrath",
    region: "Hoi An, Vietnam",
    intro: "Bà Liên teaches you to rise after the fall — healing between blows.",
    boss: {
      name: "The Monsoon",
      difficulty: "hard",
      fighter: { name: "The Monsoon", maxHp: 160, atk: 28, def: 14, speed: 15, lom: "water" },
    },
    tradingLesson: "Momentum Trading",
    unlocks: [],
  },
  {
    id: 7,
    act: 3,
    title: "The Phantom Unmasked",
    region: "Siem Reap, Cambodia",
    intro: "A hidden lab by Angkor Wat. The Phantom Breeder's true face revealed.",
    boss: {
      name: "Chimera Alpha",
      difficulty: "hard",
      fighter: { name: "Chimera Alpha", maxHp: 175, atk: 30, def: 15, speed: 14, lom: "fire" },
    },
    tradingLesson: "Backtesting",
    unlocks: [],
  },
  {
    id: 8,
    act: 3,
    title: "The Siege of Kanchanaburi",
    region: "Kanchanaburi (siege)",
    intro: "The Syndicate burns your village. Anger nearly takes the wheel.",
    boss: {
      name: "Iron Claw",
      difficulty: "hard",
      fighter: { name: "Iron Claw", maxHp: 190, atk: 33, def: 16, speed: 14, lom: "earth" },
    },
    tradingLesson: "Kill Switch",
    unlocks: [],
  },
  {
    id: 9,
    act: 4,
    title: "The Alliance",
    region: "Alliance Camp",
    intro: "Five nations unite. Sparring with the masters to sharpen the edge.",
    boss: {
      name: "Alliance Sparring",
      difficulty: "hard",
      fighter: { name: "Alliance Sparring", maxHp: 200, atk: 32, def: 17, speed: 15, lom: "spirit" },
    },
    tradingLesson: "Diversification",
    unlocks: [],
  },
  {
    id: 10,
    act: 4,
    title: "The Grand Arena War",
    region: "Ayutthaya Grand",
    intro: "Alliance vs Syndicate. The Syndicate cheats; chaos erupts in the ruins.",
    boss: {
      name: "Syndicate Chain",
      difficulty: "hard",
      fighter: { name: "Syndicate Chain", maxHp: 215, atk: 35, def: 18, speed: 16, lom: "fire" },
    },
    tradingLesson: "Market Correlation",
    unlocks: [],
  },
  {
    id: 11,
    act: 4,
    title: "Brother Against Brother",
    region: "Ayutthaya Ruins",
    intro: "Kai, the Phantom's weapon. You stop attacking — and reach him.",
    boss: {
      name: "Kai + Shadow Fang",
      difficulty: "hard",
      fighter: { name: "Kai + Shadow Fang", maxHp: 235, atk: 38, def: 20, speed: 17, lom: "water" },
    },
    tradingLesson: "Sunk Cost Fallacy",
    unlocks: [],
  },
  {
    id: 12,
    act: 4,
    title: "The Crow of Freedom",
    region: "Ayutthaya (Epilogue)",
    intro: "Together with Kai, you face the Phantom Breeder. Freedom, not revenge.",
    boss: {
      name: "Phantom Breeder",
      difficulty: "hard",
      fighter: { name: "Phantom Breeder", maxHp: 260, atk: 41, def: 22, speed: 18, lom: "spirit" },
    },
    tradingLesson: "Freedom Trade",
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
