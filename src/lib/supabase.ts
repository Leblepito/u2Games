import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single, validated Supabase client.
 *
 * Why this lives here instead of in each feature file:
 *   - one place to enforce env presence (used to be silently null in
 *     `features/lobby/api/lobbyApi.ts`, which masked deploys missing
 *     NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
 *   - one place to remind future-us that the anon key reaches the
 *     browser. ANY table this client touches MUST have RLS policies
 *     enabled — see `docs/specs/supabase-rls.sql`.
 */

let cached: SupabaseClient | null | undefined;

function isProductionLike(): boolean {
  // Re-read env at call time so tests can flip it without re-importing.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
  if (vercelEnv === "production" || vercelEnv === "preview") return true;
  return process.env.NODE_ENV === "production";
}

export interface SupabaseEnvReport {
  ok: boolean;
  missing: string[];
}

export function checkSupabaseEnv(): SupabaseEnvReport {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { ok: missing.length === 0, missing };
}

export class SupabaseEnvMissingError extends Error {
  constructor(missing: string[]) {
    super(
      `Supabase env missing: ${missing.join(", ")}. ` +
        `Set both in the environment (Vercel → Settings → Environment Variables, ` +
        `or .env.local for dev).`,
    );
    this.name = "SupabaseEnvMissingError";
  }
}

/**
 * Get the shared Supabase client.
 *
 * - In production-like envs (Vercel preview/production, NODE_ENV=production)
 *   missing env throws immediately so the deploy fails loudly instead of
 *   returning silent `null` and shipping a half-broken UX.
 * - In dev / test, missing env logs a warning and returns null so feature
 *   files can short-circuit (their original behavior).
 *
 * Reset between tests with `_resetSupabaseClientForTests()`.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const report = checkSupabaseEnv();
  if (!report.ok) {
    if (isProductionLike()) {
      throw new SupabaseEnvMissingError(report.missing);
    }
    if (typeof console !== "undefined") {
      console.warn(
        `[supabase] missing env (${report.missing.join(", ")}); ` +
          `online features disabled in this dev session.`,
      );
    }
    cached = null;
    return cached;
  }

  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}

/** Test-only: drop the cached client + cached env decision. */
export function _resetSupabaseClientForTests(): void {
  cached = undefined;
}
