"use client";

import { useSyncStore, type SyncStatus } from "../model/syncStore";

const LABEL: Record<SyncStatus, string> = {
  idle: "☁ Cloud Save",
  syncing: "Syncing…",
  synced: "✓ Synced",
  offline: "Offline",
  error: "Sync failed — retry",
};

const TONE: Record<SyncStatus, string> = {
  idle: "text-slate-300",
  syncing: "text-sky-300",
  synced: "text-emerald-400",
  offline: "text-slate-500",
  error: "text-red-400",
};

export function CloudSaveButton(): React.JSX.Element {
  const status = useSyncStore((s) => s.status);
  const sync = useSyncStore((s) => s.sync);

  return (
    <button
      type="button"
      onClick={() => void sync()}
      disabled={status === "syncing"}
      className={`rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:border-amber-400 disabled:opacity-50 ${TONE[status]}`}
      title="Sync your progress to the cloud (anonymous account)"
    >
      {LABEL[status]}
    </button>
  );
}
