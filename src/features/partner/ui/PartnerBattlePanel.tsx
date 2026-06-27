"use client";

import { useState } from "react";

import { canUseMove, MOVES, MOVE_IDS, type Fighter, type MoveId } from "@/features/combat";
import { useGameStore } from "@/lib/store";
import { highestSyncMove } from "../lib/lom";
import { usePartnerStore } from "../model/partnerStore";
import { LomMeter } from "./LomMeter";

function Bar({ fighter, accent }: { fighter: Fighter; accent: string }): React.JSX.Element {
  const hpPct = Math.max(0, Math.round((fighter.hp / fighter.maxHp) * 100));
  const down = fighter.hp <= 0;
  return (
    <div className={`flex-1 rounded-xl border border-white/10 bg-slate-900/70 p-3 ${down ? "opacity-50" : ""}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-white">{fighter.name}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{fighter.lom}</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${accent} transition-all`} style={{ width: `${hpPct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-slate-400">
        {down ? "down" : `HP ${fighter.hp}/${fighter.maxHp}`}
      </div>
    </div>
  );
}

function MoveRow({
  who,
  fighter,
  selected,
  onSelect,
  disabled,
}: {
  who: string;
  fighter: Fighter;
  selected: MoveId;
  onSelect: (id: MoveId) => void;
  disabled: boolean;
}): React.JSX.Element {
  const unlocked = useGameStore((s) => s.unlockedMoves);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-slate-400">{who}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {MOVE_IDS.filter((id) => unlocked.includes(id)).map((id) => {
          const usable = !disabled && canUseMove(fighter, id);
          return (
            <button
              key={id}
              type="button"
              disabled={!usable}
              onClick={() => onSelect(id)}
              className={`rounded-md border px-2 py-1 text-left text-xs disabled:opacity-40 ${
                selected === id ? "border-amber-400 bg-slate-700" : "border-white/10 bg-slate-800"
              }`}
            >
              {MOVES[id].name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PartnerBattlePanel(): React.JSX.Element {
  const phase = usePartnerStore((s) => s.phase);
  const player = usePartnerStore((s) => s.player);
  const partner = usePartnerStore((s) => s.partner);
  const enemy = usePartnerStore((s) => s.enemy);
  const sync = usePartnerStore((s) => s.sync);
  const log = usePartnerStore((s) => s.log);
  const reward = usePartnerStore((s) => s.reward);
  const startBattle = usePartnerStore((s) => s.startBattle);
  const round = usePartnerStore((s) => s.round);
  const syncStrike = usePartnerStore((s) => s.syncStrike);
  const reset = usePartnerStore((s) => s.reset);
  const playerName = useGameStore((s) => s.playerName);

  const [playerMove, setPlayerMove] = useState<MoveId>("peck");
  const [partnerMove, setPartnerMove] = useState<MoveId>("peck");

  const isOver = phase === "victory" || phase === "defeat";
  const canAct = phase === "playerTurn";
  const comboReady = highestSyncMove(sync);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sky-400">Partner Battle</h1>
          <span className="text-xs text-slate-500">Koh Sawan · S2</span>
        </header>

        {phase === "idle" ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
            <p className="text-slate-300">Face a Keeper alongside Ren&apos;s rooster, Yuki. Coordinate to build Lom sync.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => startBattle({ playerName, difficulty: d })}
                  className="rounded-lg bg-sky-500 px-5 py-2 font-semibold capitalize text-slate-950 hover:bg-sky-400"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Bar fighter={player} accent="bg-emerald-500" />
              <Bar fighter={partner} accent="bg-sky-400" />
              <Bar fighter={enemy} accent="bg-red-500" />
            </div>

            <div className="mt-3">
              <LomMeter sync={sync} />
            </div>

            {!isOver && (
              <div className="mt-4 space-y-3">
                <MoveRow who="Your Rooster" fighter={player} selected={playerMove} onSelect={setPlayerMove} disabled={!canAct || player.hp <= 0} />
                <MoveRow who="Yuki" fighter={partner} selected={partnerMove} onSelect={setPartnerMove} disabled={!canAct || partner.hp <= 0} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!canAct}
                    onClick={() => round(playerMove, partnerMove)}
                    className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
                  >
                    Commit Round
                  </button>
                  <button
                    type="button"
                    disabled={!canAct || !comboReady}
                    onClick={() => syncStrike()}
                    className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-2 font-semibold text-slate-950 hover:brightness-110 disabled:opacity-40"
                  >
                    {comboReady ? `Sync: ${comboReady.name}` : "Sync Strike"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 h-36 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              {log.map((line, i) => (
                <div key={i} className="border-b border-white/5 py-1 text-slate-300 last:border-0">
                  {line}
                </div>
              ))}
            </div>

            {isOver && (
              <div className="mt-4 rounded-xl border border-sky-400/40 bg-slate-900/90 p-5 text-center">
                <p className="text-xl font-bold text-sky-400">{phase === "victory" ? "Victory!" : "Defeat"}</p>
                {reward && phase === "victory" && (
                  <p className="mt-1 text-sm text-emerald-400">+{reward.coins} RoosterCoin · +{reward.xp} XP</p>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-lg bg-sky-500 px-5 py-2 font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Back
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
