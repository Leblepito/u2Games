"use client";

import { useGameStore } from "@/lib/store";

export default function DialogueBox(): React.JSX.Element | null {
  const phase = useGameStore((s) => s.phase);
  const speaker = useGameStore((s) => s.dialogueSpeaker);
  const lines = useGameStore((s) => s.dialogueLines);
  const index = useGameStore((s) => s.dialogueIndex);
  const advance = useGameStore((s) => s.advanceDialogue);
  const close = useGameStore((s) => s.closeDialogue);

  if (phase !== "dialogue" || lines.length === 0) return null;

  const isLast = index >= lines.length - 1;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl z-50"
      onClick={advance}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "e") advance();
        if (e.key === "Escape") close();
      }}
      tabIndex={0}
      role="dialog"
      aria-label="NPC dialogue"
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="text-amber-400 font-bold text-sm mb-2 uppercase tracking-wider">
          {speaker}
        </div>

        <p className="text-white text-lg leading-relaxed">
          {lines[index]}
        </p>

        <div className="flex justify-between items-center mt-4">
          <span className="text-slate-500 text-xs">
            {index + 1} / {lines.length}
          </span>
          <span className="text-slate-500 text-xs">
            {isLast ? "Click to close" : "Click to continue"}
          </span>
        </div>
      </div>
    </div>
  );
}
