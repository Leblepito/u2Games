"use client";

import { useGameStore } from "@/lib/store";
import { canUseMove } from "../lib/combatEngine";
import { MOVES, MOVE_IDS } from "../lib/moves";
import type { Fighter } from "../lib/types";
import { useCombatStore } from "../model/combatStore";

function HealthBar({ fighter, accent }: { fighter: Fighter; accent: string }): React.JSX.Element {
  const hpPct = Math.max(0, Math.round((fighter.hp / fighter.maxHp) * 100));
  const stPct = Math.max(0, Math.round((fighter.stamina / fighter.maxStamina) * 100));
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-white">{fighter.name}</span>
        <span className="text-xs uppercase tracking-wide text-slate-400">{fighter.lom}</span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${accent} transition-all`} style={{ width: `${hpPct}%` }} />
      </div>
      <div className="mt-1 text-xs text-slate-400">
        HP {fighter.hp}/{fighter.maxHp}
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${stPct}%` }} />
      </div>
      <div className="mt-1 text-xs text-slate-500">
        Stamina {fighter.stamina}/{fighter.maxStamina}
      </div>
    </div>
  );
}

export function BattlePanel(): React.JSX.Element {
  const phase = useCombatStore((s) => s.phase);
  const turn = useCombatStore((s) => s.turn);
  const player = useCombatStore((s) => s.player);
  const enemy = useCombatStore((s) => s.enemy);
  const log = useCombatStore((s) => s.log);
  const reward = useCombatStore((s) => s.reward);
  const startBattle = useCombatStore((s) => s.startBattle);
  const playerAction = useCombatStore((s) => s.playerAction);
  const reset = useCombatStore((s) => s.reset);
  const playerName = useGameStore((s) => s.playerName);

  const isOver = phase === "victory" || phase === "defeat";
  const canAct = phase === "playerTurn";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">Arena</h1>
          {phase !== "idle" && (
            <span className="text-sm text-slate-400">Turn {turn}</span>
          )}
        </header>

        {phase === "idle" ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
            <p className="text-slate-300">Face the Old Crow in a training match.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => startBattle({ playerName, difficulty: d })}
                  className="rounded-lg bg-amber-500 px-5 py-2 font-semibold capitalize text-slate-950 hover:bg-amber-400"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <HealthBar fighter={player} accent="bg-emerald-500" />
              <HealthBar fighter={enemy} accent="bg-red-500" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MOVE_IDS.map((id) => {
                const move = MOVES[id];
                const usable = canAct && canUseMove(player, id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!usable}
                    onClick={() => playerAction(id)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-left text-sm hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="font-semibold">{move.name}</div>
                    <div className="text-xs text-slate-400">
                      {move.kind === "guard" ? "guard" : `${move.damageMultiplier}×`} · {move.staminaCost} stam
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 h-40 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              {log.map((line, i) => (
                <div key={i} className="border-b border-white/5 py-1 text-slate-300 last:border-0">
                  {line}
                </div>
              ))}
            </div>

            {isOver && (
              <div className="mt-4 rounded-xl border border-amber-400/40 bg-slate-900/90 p-5 text-center">
                <p className="text-xl font-bold text-amber-400">
                  {phase === "victory" ? "Victory!" : "Defeat"}
                </p>
                {reward && phase === "victory" && (
                  <p className="mt-1 text-sm text-emerald-400">
                    +{reward.coins} RoosterCoin · +{reward.xp} XP
                  </p>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Back to Arena
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
