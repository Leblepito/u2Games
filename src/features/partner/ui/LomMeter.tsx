"use client";

import { SYNC_MOVES, highestSyncMove } from "../lib/lom";

/** Lom partner-sync gauge with the combo thresholds marked. */
export function LomMeter({ sync }: { sync: number }): React.JSX.Element {
  const pct = Math.max(0, Math.min(100, sync));
  const ready = highestSyncMove(sync);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-sky-300">
          Lom Sync
        </span>
        <span className="text-xs text-slate-400">
          {pct}/100{ready ? ` · ${ready.name} ready` : ""}
        </span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
        {SYNC_MOVES.map((m) => (
          <span
            key={m.id}
            className="absolute top-0 h-full w-px bg-white/30"
            style={{ left: `${m.requiredSync}%` }}
            title={`${m.name} (${m.requiredSync})`}
          />
        ))}
      </div>
    </div>
  );
}
