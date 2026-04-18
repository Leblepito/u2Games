"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { normalizeLobbyName, isLobbyNameValid } from "../lib/validators";
import { useLobbyStore } from "../model/lobbyStore";

export function LobbyPanel(): React.JSX.Element {
  const status = useLobbyStore((s) => s.status);
  const playerName = useLobbyStore((s) => s.playerName);
  const setPlayerName = useLobbyStore((s) => s.setPlayerName);
  const createLobby = useLobbyStore((s) => s.createLobby);
  const joinLobby = useLobbyStore((s) => s.joinLobby);
  const error = useLobbyStore((s) => s.error);
  const enterFromLobby = useGameStore((s) => s.enterFromLobby);
  const [code, setCode] = useState("");

  const disabled = status === "connecting" || !isLobbyNameValid(playerName);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur">
        <h1 className="text-2xl font-bold text-amber-400">Lobby</h1>
        <p className="mt-2 text-slate-400">Create or join a room before entering Kanchanaburi.</p>

        <label className="mt-6 block text-sm text-slate-300">Player Name</label>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(normalizeLobbyName(e.target.value))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-amber-400"
          placeholder="Enter your name"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={async () => {
              await createLobby();
              enterFromLobby(playerName);
            }}
            className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
          >
            Create Lobby
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={async () => {
              await joinLobby();
              enterFromLobby(playerName);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold disabled:opacity-50"
          >
            Join Lobby
          </button>
        </div>

        <label className="mt-6 block text-sm text-slate-300">Room Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-amber-400"
          placeholder="ABC123"
        />

        <div className="mt-2 text-xs text-slate-500">Status: {status}</div>
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
      </div>
    </div>
  );
}
