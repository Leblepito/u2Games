/**
 * Story / campaign domain types. The campaign is a linear chain of chapters;
 * each one is a boss fight that, when cleared, advances the player's
 * `currentChapter` (see @/lib/store) and unlocks new moves.
 *
 * See docs/gdd/story-bible-s1.md for the full narrative; this MVP wires the
 * Act 1–2 spine (Ch0–4). Dialogue, side quests and Ch5+ are added later.
 */

import type { Difficulty, Fighter, MoveId } from "@/features/combat";

export interface ChapterBoss {
  /** Display name of the boss rooster. */
  name: string;
  /** AI tier + reward bracket for the fight. */
  difficulty: Difficulty;
  /** Stat overrides applied on top of the default enemy fighter. */
  fighter: Partial<Fighter>;
}

export interface Chapter {
  /** Chapter number; also the value written to currentChapter on clear. */
  id: number;
  /** Act this chapter belongs to (1–4). */
  act: number;
  title: string;
  /** Region the chapter takes place in. */
  region: string;
  /** One-line setup shown on the chapter card (details expanded later). */
  intro: string;
  boss: ChapterBoss;
  /** The chapter's trading-lesson tag (story bible "Trading dersi"). */
  tradingLesson: string;
  /** Moves unlocked by clearing this chapter. */
  unlocks: MoveId[];
}

/** A chapter is done, currently playable, or still locked behind earlier ones. */
export type ChapterStatus = "completed" | "active" | "locked";
