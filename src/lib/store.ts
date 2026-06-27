import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GamePhase =
  | "menu"
  | "lobby"
  | "exploring"
  | "dialogue"
  | "combat"
  | "cutscene"
  | "inventory"
  | "map";

export type Season = 1 | 2;

export interface GameState {
  phase: GamePhase;
  season: Season;
  currentChapter: number;
  playerName: string;
  roosterCoins: number;
  xp: number;
  level: number;
  dialogueSpeaker: string;
  dialogueLines: string[];
  dialogueIndex: number;
  playerPosition: [number, number, number];

  // Actions
  setPhase: (phase: GamePhase) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXP: (amount: number) => void;
  setChapter: (chapter: number) => void;
  openDialogue: (speaker: string, lines: string[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  enterFromLobby: (playerName: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: "lobby",
      season: 1,
      currentChapter: 0,
      playerName: "",
      roosterCoins: 0,
      xp: 0,
      level: 1,
      dialogueSpeaker: "",
      dialogueLines: [],
      dialogueIndex: 0,
      playerPosition: [0, 0.5, 5],

      setPhase: (phase) => set({ phase }),

      addCoins: (amount) =>
        set((s) => ({ roosterCoins: s.roosterCoins + amount })),

      spendCoins: (amount) => {
        const { roosterCoins } = get();
        if (roosterCoins < amount) return false;
        set({ roosterCoins: roosterCoins - amount });
        return true;
      },

      addXP: (amount) =>
        set((s) => {
          const newXP = s.xp + amount;
          const newLevel = Math.floor(newXP / 100) + 1;
          return { xp: newXP, level: newLevel };
        }),

      setChapter: (chapter) => set({ currentChapter: chapter }),

      openDialogue: (speaker, lines) =>
        set({ phase: "dialogue", dialogueSpeaker: speaker, dialogueLines: lines, dialogueIndex: 0 }),

      advanceDialogue: () => {
        const { dialogueIndex, dialogueLines } = get();
        if (dialogueIndex < dialogueLines.length - 1) {
          set({ dialogueIndex: dialogueIndex + 1 });
        } else {
          get().closeDialogue();
        }
      },

      closeDialogue: () =>
        set({ phase: "exploring", dialogueSpeaker: "", dialogueLines: [], dialogueIndex: 0 }),

      setPlayerPosition: (pos) => set({ playerPosition: pos }),

      enterFromLobby: (playerName) =>
        set({ phase: "exploring", playerName }),
    }),
    { name: "roosterverse-save" }
  )
);
