import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold text-gradient mb-4">RoosterVerse</h1>
      <p className="text-slate-400 text-lg mb-8 text-center max-w-lg">
        Raise legendary roosters. Battle across Southeast Asia.
        Discover ancient secrets. Earn your freedom.
      </p>
      <Link
        href="/play"
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-lg hover:brightness-110 transition-all"
      >
        🐓 Enter the Arena
      </Link>
    </main>
  );
}
