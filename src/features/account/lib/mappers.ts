/**
 * Pure mappers between the offline game store (@/lib/store) and the Supabase
 * rv_users / rv_story_progress rows. Kept free of supabase/store imports so the
 * sync math is unit-testable.
 *
 * Coin-authority model: **client-owns + monotonic max-merge mirror.** The
 * persisted local store is the source of truth; the server is a per-user mirror
 * (RLS restricts writes to the user's own row). Sync takes the field-wise max of
 * progress + the union of unlocked moves, so neither side ever loses progress.
 * This is durability/cross-device, NOT anti-cheat — server-authoritative battle
 * validation is a separate follow-up.
 */

import type { GameState, Season } from "@/lib/store";

/** The slice of game state that is mirrored to the cloud. */
export type ProfileSnapshot = Pick<
  GameState,
  "playerName" | "roosterCoins" | "xp" | "level" | "currentChapter" | "season" | "unlockedMoves"
>;

export interface RvUserRow {
  id: string;
  display_name: string | null;
  rooster_coins: number;
  xp: number;
  level: number;
  current_chapter: number;
  current_season: number;
}

export interface RvStoryRow {
  user_id: string;
  season: number;
  completed_chapters: number[];
  unlocked_moves: string[];
}

/** Linear campaign: every chapter below the current one is completed. */
export function completedChapters(currentChapter: number): number[] {
  return Array.from({ length: Math.max(0, currentChapter) }, (_, i) => i);
}

export function snapshotToUserRow(userId: string, s: ProfileSnapshot): RvUserRow {
  return {
    id: userId,
    display_name: s.playerName || null,
    rooster_coins: s.roosterCoins,
    xp: s.xp,
    level: s.level,
    current_chapter: s.currentChapter,
    current_season: s.season,
  };
}

export function snapshotToStoryRow(userId: string, s: ProfileSnapshot): RvStoryRow {
  return {
    user_id: userId,
    season: s.season,
    completed_chapters: completedChapters(s.currentChapter),
    unlocked_moves: s.unlockedMoves,
  };
}

/** Build a snapshot from server rows (story row optional). */
export function rowsToSnapshot(user: RvUserRow, story: RvStoryRow | null): ProfileSnapshot {
  return {
    playerName: user.display_name ?? "",
    roosterCoins: user.rooster_coins,
    xp: user.xp,
    level: user.level,
    currentChapter: user.current_chapter,
    season: (user.current_season as Season) ?? 1,
    unlockedMoves: story?.unlocked_moves ?? [],
  };
}

/**
 * Monotonic merge: progress fields take the max, unlocked moves union, name
 * prefers a non-empty local value. Order-independent and lossless.
 */
export function mergeSnapshots(local: ProfileSnapshot, remote: ProfileSnapshot): ProfileSnapshot {
  return {
    playerName: local.playerName || remote.playerName,
    roosterCoins: Math.max(local.roosterCoins, remote.roosterCoins),
    xp: Math.max(local.xp, remote.xp),
    level: Math.max(local.level, remote.level),
    currentChapter: Math.max(local.currentChapter, remote.currentChapter),
    season: (Math.max(local.season, remote.season) as Season),
    // Sorted union → deterministic output, so re-syncing the same state is a no-op.
    unlockedMoves: [...new Set([...local.unlockedMoves, ...remote.unlockedMoves])].sort(),
  };
}
