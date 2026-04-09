"use client";

import { useGameStore } from "@/lib/store";

export default function GameHUD(): React.JSX.Element | null {
  const phase = useGameStore((s) => s.phase);
  const chapter = useGameStore((s) => s.currentChapter);
  const coins = useGameStore((s) => s.roosterCoins);
  const level = useGameStore((s) => s.level);

  if (phase === "menu") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex justify-between items-start p-4">
        {/* Chapter + Level */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            Chapter {chapter}
          </div>
          <div className="text-white text-sm">
            Lv.{level} &middot; Kanchanaburi
          </div>
        </div>

        {/* Coins */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-amber-400">RC</span>
          <span className="text-white font-bold">{coins}</span>
        </div>
      </div>

      {/* Controls hint */}
      {phase === "exploring" && (
        <div className="absolute bottom-20 left-4 bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-400">
          <div>WASD / Arrows — Move</div>
          <div>E / Space — Interact</div>
        </div>
      )}
    </div>
  );
}
