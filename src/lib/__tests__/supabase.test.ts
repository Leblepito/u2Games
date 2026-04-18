import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  SupabaseEnvMissingError,
  _resetSupabaseClientForTests,
  checkSupabaseEnv,
} from "@/lib/supabase";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NODE_ENV",
  "VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_ENV",
] as const;

const originals: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) originals[k] = process.env[k];
  _resetSupabaseClientForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (originals[k] === undefined) delete process.env[k];
    else process.env[k] = originals[k]!;
  }
  _resetSupabaseClientForTests();
});

describe("checkSupabaseEnv", () => {
  it("reports both missing when neither is set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const r = checkSupabaseEnv();
    expect(r.ok).toBe(false);
    expect(r.missing.sort()).toEqual([
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("reports OK when both are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
    expect(checkSupabaseEnv()).toEqual({ ok: true, missing: [] });
  });
});

describe("getSupabase", () => {
  it("throws in Vercel production when env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";

    const { getSupabase } = await import("@/lib/supabase");
    expect(() => getSupabase()).toThrow(SupabaseEnvMissingError);
  });

  it("warns and returns null in dev when env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    process.env.NODE_ENV = "development";

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { getSupabase } = await import("@/lib/supabase");
    expect(getSupabase()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("returns a client when env is configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";

    const { getSupabase } = await import("@/lib/supabase");
    const client = getSupabase();
    expect(client).not.toBeNull();
    // Returns the same cached instance on subsequent calls.
    expect(getSupabase()).toBe(client);
  });
});
