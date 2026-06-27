"use client";

import { useState } from "react";

import { useGameStore } from "@/lib/store";
import { canUseMove } from "../lib/combatEngine";
import { HARD_MODE_ENTRY_FEE } from "../lib/economy";
import { MOVES, MOVE_IDS } from "../lib/moves";
import type { Difficulty, Fighter } from "../lib/types";
import { useCombatStore } from "../model/combatStore";

function WalletHud(): React.JSX.Element {
  const coins = useGameStore((s) => s.roosterCoins);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-semibold text-amber-300">{coins} RC</span>
      <span className="text-slate-500">·</span>
      <span className="text-slate-300">Lv {level}</span>
      <span className="text-xs text-slate-500">{xp} XP</span>
    </div>
  );
}

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
  const notice = useCombatStore((s) => s.notice);
  const startBattle = useCombatStore((s) => s.startBattle);
  const playerAction = useCombatStore((s) => s.playerAction);
  const reset = useCombatStore((s) => s.reset);
  const playerName = useGameStore((s) => s.playerName);

  const [wager, setWager] = useState(0);

  const isOver = phase === "victory" || phase === "defeat";
  const canAct = phase === "playerTurn";
  const netCoins = reward ? reward.payout - reward.wager : 0;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">Arena</h1>
          <div className="flex items-center gap-4">
            <WalletHud />
            {phase !== "idle" && (
              <span className="text-sm text-slate-400">Turn {turn}</span>
            )}
          </div>
        </header>

        {phase === "idle" ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center">
            <p className="text-slate-300">
              Face the Old Crow. Stake RoosterCoin to double it — or fight for the flat prize.
            </p>

            <label className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-300">
              Wager
              <input
                type="number"
                min={0}
                step={10}
                value={wager}
                onChange={(e) => setWager(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-24 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-right text-white"
              />
              RC
            </label>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {(["easy", "normal", "hard"] as const).map((d: Difficulty) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => startBattle({ playerName, difficulty: d, wager })}
                  className="rounded-lg bg-amber-500 px-5 py-2 font-semibold capitalize text-slate-950 hover:bg-amber-400"
                >
                  {d}
                  {d === "hard" && (
                    <span className="ml-1 text-xs font-normal text-slate-700">
                      +{HARD_MODE_ENTRY_FEE} fee
                    </span>
                  )}
                </button>
              ))}
            </div>

            {notice && <p className="mt-4 text-sm text-red-400">{notice}</p>}
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
                  <>
                    <p className="mt-1 text-sm text-emerald-400">
                      +{reward.coins} RoosterCoin · +{reward.xp} XP
                    </p>
                    {reward.wager > 0 && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Stake {reward.wager} → {reward.payout} back (net{" "}
                        {netCoins >= 0 ? "+" : ""}
                        {netCoins} RC)
                      </p>
                    )}
                    {notice && <p className="mt-1 text-xs text-amber-300">{notice}</p>}
                  </>
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
