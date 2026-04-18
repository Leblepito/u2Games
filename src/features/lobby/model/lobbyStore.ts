"use client";

import { create } from "zustand";
import { createActor } from "xstate";
import { lobbyMachine } from "./lobbyMachine";

export type LobbyStatus = "idle" | "connecting" | "ready" | "error";

interface LobbySlice {
  status: LobbyStatus;
  playerName: string;
  error: string | null;
  setPlayerName: (value: string) => void;
  createLobby: () => Promise<void>;
  joinLobby: () => Promise<void>;
  resetLobby: () => void;
}

const actor = createActor(lobbyMachine).start();

function stateToStatus(value: string): LobbyStatus {
  if (value === "connecting") return "connecting";
  if (value === "ready") return "ready";
  if (value === "error") return "error";
  return "idle";
}

export const useLobbyStore = create<LobbySlice>((set) => {
  actor.subscribe((snapshot) => {
    const context = snapshot.context;
    set({
      status: stateToStatus(String(snapshot.value)),
      playerName: context.playerName,
      error: context.error,
    });
  });

  return {
    status: "idle",
    playerName: "",
    error: null,
    setPlayerName: (value) => {
      actor.send({ type: "SET_NAME", value });
    },
    createLobby: async () => {
      actor.send({ type: "CREATE" });
      await new Promise((resolve) => setTimeout(resolve, 100));
      actor.send({ type: "READY" });
    },
    joinLobby: async () => {
      actor.send({ type: "JOIN" });
      await new Promise((resolve) => setTimeout(resolve, 100));
      actor.send({ type: "READY" });
    },
    resetLobby: () => {
      actor.send({ type: "RESET" });
    },
  };
});
