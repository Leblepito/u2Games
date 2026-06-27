"use client";

import dynamic from "next/dynamic";

const BattlePanel = dynamic(
  () => import("@/features/combat").then((mod) => mod.BattlePanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="animate-pulse text-slate-400">Entering the Arena...</p>
      </div>
    ),
  },
);

export default function BattlePage(): React.JSX.Element {
  return <BattlePanel />;
}
