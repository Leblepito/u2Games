import { describe, it, expect, beforeAll, afterAll } from "vitest";

// @/lib/store uses zustand persist which touches localStorage at import time.
const realLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;

beforeAll(() => {
  const mem = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, String(v)),
    removeItem: (k) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

afterAll(() => {
  if (realLocalStorage === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    (globalThis as { localStorage?: Storage }).localStorage = realLocalStorage;
  }
});

describe("syncStore (offline)", () => {
  it("reports offline and leaves the game store untouched when Supabase env is absent", async () => {
    // No NEXT_PUBLIC_SUPABASE_* in the test env → getSupabase() returns null.
    const { useSyncStore } = await import("../syncStore");
    const { useGameStore } = await import("@/lib/store");

    const coinsBefore = useGameStore.getState().roosterCoins;
    await useSyncStore.getState().sync();

    expect(useSyncStore.getState().status).toBe("offline");
    expect(useSyncStore.getState().userId).toBeNull();
    expect(useGameStore.getState().roosterCoins).toBe(coinsBefore);
  });
});
