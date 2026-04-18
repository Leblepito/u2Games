import { assign, setup } from "xstate";

interface LobbyContext {
  playerName: string;
  error: string | null;
}

type LobbyEvent =
  | { type: "SET_NAME"; value: string }
  | { type: "CREATE" }
  | { type: "JOIN" }
  | { type: "FAIL"; error: string }
  | { type: "READY" }
  | { type: "RESET" };

export const lobbyMachine = setup({
  types: {
    context: {} as LobbyContext,
    events: {} as LobbyEvent,
  },
  actions: {
    setName: assign({
      playerName: ({ event }) => (event.type === "SET_NAME" ? event.value : ""),
      error: () => null,
    }),
    setError: assign({
      error: ({ event }) => (event.type === "FAIL" ? event.error : null),
    }),
    clearError: assign({
      error: () => null,
    }),
  },
}).createMachine({
  id: "lobby",
  initial: "idle",
  context: {
    playerName: "",
    error: null,
  },
  states: {
    idle: {
      on: {
        SET_NAME: { actions: "setName" },
        CREATE: "connecting",
        JOIN: "connecting",
      },
    },
    connecting: {
      on: {
        READY: "ready",
        FAIL: { target: "error", actions: "setError" },
      },
    },
    error: {
      on: {
        SET_NAME: { target: "idle", actions: "setName" },
        RESET: { target: "idle", actions: "clearError" },
      },
    },
    ready: {
      on: {
        RESET: { target: "idle", actions: "clearError" },
      },
    },
  },
});
