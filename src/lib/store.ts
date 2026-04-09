import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GamePhase =
  | "menu"
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

  // Actions
  setPhase: (phase: GamePhase) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXP: (amount: number) => void;
  setChapter: (chapter: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: "menu",
      season: 1,
      currentChapter: 0,
      playerName: "",
      roosterCoins: 0,
      xp: 0,
      level: 1,

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
    }),
    { name: "roosterverse-save" }
  )
);
