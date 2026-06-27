"use client";

import dynamic from "next/dynamic";

const ChapterMap = dynamic(
  () => import("@/features/story").then((mod) => mod.ChapterMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="animate-pulse text-slate-400">Loading the campaign...</p>
      </div>
    ),
  },
);

export default function CampaignPage(): React.JSX.Element {
  return <ChapterMap />;
}
