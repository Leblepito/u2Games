"use client";

import dynamic from "next/dynamic";

const IslandMap = dynamic(() => import("@/features/partner").then((mod) => mod.IslandMap), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <p className="animate-pulse text-slate-400">Charting Koh Sawan...</p>
    </div>
  ),
});

export default function IslandPage(): React.JSX.Element {
  return <IslandMap />;
}
