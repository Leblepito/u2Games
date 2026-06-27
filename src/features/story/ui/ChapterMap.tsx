"use client";

import { useRouter } from "next/navigation";

import { useGameStore } from "@/lib/store";
import { useCombatStore } from "@/features/combat";
import { CHAPTERS, chapterStatus } from "../lib/chapters";
import type { Chapter, ChapterStatus } from "../lib/types";

const STATUS_BADGE: Record<ChapterStatus, string> = {
  completed: "text-emerald-400",
  active: "text-amber-300",
  locked: "text-slate-600",
};

function ChapterCard({ chapter }: { chapter: Chapter }): React.JSX.Element {
  const router = useRouter();
  const currentChapter = useGameStore((s) => s.currentChapter);
  const playerName = useGameStore((s) => s.playerName);
  const status = chapterStatus(chapter.id, currentChapter);

  const fight = (): void => {
    // Hand the boss to the shared combat store, then jump into the arena.
    // A win advances currentChapter via the economy loop's chapterId hook.
    useCombatStore.getState().startBattle({
      playerName,
      difficulty: chapter.boss.difficulty,
      enemy: chapter.boss.fighter,
      chapterId: chapter.id,
    });
    router.push("/battle");
  };

  const locked = status === "locked";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        locked
          ? "border-white/5 bg-slate-900/40 opacity-60"
          : "border-white/10 bg-slate-900/80"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          Act {chapter.act} · Ch {chapter.id}
        </span>
        <span className={`text-xs font-semibold uppercase ${STATUS_BADGE[status]}`}>
          {status === "completed" ? "✓ cleared" : status}
        </span>
      </div>

      <h2 className="mt-1 text-lg font-bold text-white">{chapter.title}</h2>
      <p className="text-xs text-slate-400">{chapter.region}</p>
      <p className="mt-2 text-sm text-slate-300">{chapter.intro}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded bg-slate-800 px-2 py-0.5">
          Boss: {chapter.boss.name}
        </span>
        <span className="rounded bg-slate-800 px-2 py-0.5 capitalize">
          {chapter.boss.difficulty}
        </span>
        <span className="rounded bg-slate-800 px-2 py-0.5">
          📈 {chapter.tradingLesson}
        </span>
      </div>

      {status === "active" && (
        <button
          type="button"
          onClick={fight}
          className="mt-4 w-full rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-950 hover:bg-amber-400"
        >
          Fight {chapter.boss.name}
        </button>
      )}
      {status === "completed" && (
        <button
          type="button"
          onClick={fight}
          className="mt-4 w-full rounded-lg border border-white/10 bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-300 hover:border-amber-400"
        >
          Rematch
        </button>
      )}
    </div>
  );
}

export function ChapterMap(): React.JSX.Element {
  const currentChapter = useGameStore((s) => s.currentChapter);
  const cleared = CHAPTERS.filter((c) => c.id < currentChapter).length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-amber-400">Campaign</h1>
          <p className="text-sm text-slate-400">
            The Crow of Freedom · {cleared}/{CHAPTERS.length} chapters cleared
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {CHAPTERS.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      </div>
    </div>
  );
}
