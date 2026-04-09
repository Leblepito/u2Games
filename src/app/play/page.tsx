"use client";

import dynamic from "next/dynamic";
import DialogueBox from "@/components/ui/DialogueBox";
import GameHUD from "@/components/ui/GameHUD";

const GameCanvas = dynamic(() => import("@/components/canvas/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="text-slate-400 animate-pulse">Loading RoosterVerse...</p>
    </div>
  ),
});

export default function PlayPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950">
      <GameCanvas />
      <GameHUD />
      <DialogueBox />
    </div>
  );
}
