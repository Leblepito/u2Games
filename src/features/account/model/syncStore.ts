"use client";

import { create } from "zustand";

import { useGameStore } from "@/lib/store";
import { ensureSession, pullRows, pushSnapshot } from "../api/cloudSave";
import { mergeSnapshots, rowsToSnapshot, type ProfileSnapshot } from "../lib/mappers";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface SyncSlice {
  status: SyncStatus;
  userId: string | null;
  lastSyncedAt: number | null;
  /** Anonymous-auth, pull, monotonic-merge, apply, push. No-op offline. */
  sync: () => Promise<void>;
}

function localSnapshot(): ProfileSnapshot {
  const s = useGameStore.getState();
  return {
    playerName: s.playerName,
    roosterCoins: s.roosterCoins,
    xp: s.xp,
    level: s.level,
    currentChapter: s.currentChapter,
    season: s.season,
    unlockedMoves: s.unlockedMoves,
  };
}

export const useSyncStore = create<SyncSlice>((set) => ({
  status: "idle",
  userId: null,
  lastSyncedAt: null,

  sync: async () => {
    set({ status: "syncing" });

    const userId = await ensureSession();
    if (!userId) {
      set({ status: "offline", userId: null });
      return;
    }

    const local = localSnapshot();
    const rows = await pullRows(userId);
    const remote = rows?.user ? rowsToSnapshot(rows.user, rows.story) : null;
    const merged = remote ? mergeSnapshots(local, remote) : local;

    // Hydrate the persisted store with the merged result (lossless either way).
    useGameStore.setState({
      playerName: merged.playerName,
      roosterCoins: merged.roosterCoins,
      xp: merged.xp,
      level: merged.level,
      currentChapter: merged.currentChapter,
      season: merged.season,
      unlockedMoves: merged.unlockedMoves,
    });

    const push = await pushSnapshot(userId, merged);
    set(
      push.ok
        ? { status: "synced", userId, lastSyncedAt: Date.now() }
        : { status: "error", userId },
    );
  },
}));
