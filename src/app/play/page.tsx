"use client";

import dynamic from "next/dynamic";
import DialogueBox from "@/components/ui/DialogueBox";
import GameHUD from "@/components/ui/GameHUD";
import { useGameStore } from "@/lib/store";

const LobbyPanel = dynamic(() => import("@/features/lobby").then(mod => mod.LobbyPanel), {
  ssr: false,
});

const GameCanvas = dynamic(() => import("@/components/canvas/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="text-slate-400 animate-pulse">Loading RoosterVerse...</p>
    </div>
  ),
});

export default function PlayPage(): React.JSX.Element {
  const phase = useGameStore((s) => s.phase);

  if (phase === "lobby") {
    return <LobbyPanel />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <GameCanvas />
      <GameHUD />
      <DialogueBox />
    </div>
  );
}
