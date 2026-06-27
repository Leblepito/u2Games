"use client";

import { useRouter } from "next/navigation";

import { useGameStore } from "@/lib/store";
import { KEEPERS, keeperStatus } from "../lib/island";
import type { Keeper, KeeperStatus } from "../lib/island";
import { usePartnerStore } from "../model/partnerStore";

const STATUS_TONE: Record<KeeperStatus, string> = {
  defeated: "text-emerald-400",
  active: "text-sky-300",
  locked: "text-slate-600",
};

function KeeperCard({ keeper }: { keeper: Keeper }): React.JSX.Element {
  const router = useRouter();
  const defeated = useGameStore((s) => s.defeatedKeepers);
  const playerName = useGameStore((s) => s.playerName);
  const status = keeperStatus(keeper.id, defeated);
  const locked = status === "locked";

  const challenge = (): void => {
    usePartnerStore.getState().startBattle({
      playerName,
      difficulty: keeper.difficulty,
      enemy: keeper.fighter,
      keeperId: keeper.id,
    });
    router.push("/partner");
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${
        locked ? "border-white/5 bg-slate-900/40 opacity-60" : "border-white/10 bg-slate-900/80"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {keeper.zone} · Ch {keeper.chapterId}
        </span>
        <span className={`text-xs font-semibold uppercase ${STATUS_TONE[status]}`}>
          {status === "defeated" ? "✓ cleared" : status}
        </span>
      </div>

      <h2 className="mt-1 text-lg font-bold text-white">{keeper.name}</h2>
      <p className="text-xs uppercase tracking-wide text-sky-300/70">{keeper.fighter.lom}</p>
      <p className="mt-2 text-sm italic text-slate-300">&ldquo;{keeper.philosophy}&rdquo;</p>
      <p className="mt-1 text-xs text-slate-400">{keeper.hint}</p>

      {(status === "active" || status === "defeated") && (
        <button
          type="button"
          onClick={challenge}
          className={`mt-4 w-full rounded-lg px-5 py-2 font-semibold ${
            status === "active"
              ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
              : "border border-white/10 bg-slate-800 text-sm text-slate-300 hover:border-sky-400"
          }`}
        >
          {status === "active" ? `Challenge ${keeper.name}` : "Rematch"}
        </button>
      )}
    </div>
  );
}

export function IslandMap(): React.JSX.Element {
  const defeated = useGameStore((s) => s.defeatedKeepers);
  const cleared = KEEPERS.filter((k) => defeated.includes(k.id)).length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-sky-400">Koh Sawan</h1>
          <p className="text-sm text-slate-400">
            Paradise of Ashes · {cleared}/{KEEPERS.length} Keepers cleared
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {KEEPERS.map((keeper) => (
            <KeeperCard key={keeper.id} keeper={keeper} />
          ))}
        </div>
      </div>
    </div>
  );
}
