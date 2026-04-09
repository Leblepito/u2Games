"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/canvas/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Loading RoosterVerse...</p>
    </div>
  ),
});

export default function PlayPage() {
  return (
    <div className="min-h-screen">
      <GameCanvas />
      {/* UI overlay renders on top of Canvas */}
      <div className="ui-overlay fixed inset-0">
        {/* HUD, dialogue, menus will mount here */}
      </div>
    </div>
  );
}
