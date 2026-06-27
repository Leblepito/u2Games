"use client";

import dynamic from "next/dynamic";

const PartnerBattlePanel = dynamic(
  () => import("@/features/partner").then((mod) => mod.PartnerBattlePanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="animate-pulse text-slate-400">Approaching Koh Sawan...</p>
      </div>
    ),
  },
);

export default function PartnerPage(): React.JSX.Element {
  return <PartnerBattlePanel />;
}
