import { createBrowserClient } from '@supabase/ssr'
import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

/**
 * Browser-side Supabase client (anon key — respects RLS).
 *
 * Two entry points live here:
 *   - `createClient()` — SSR-aware browser client (cookie sync), used by React
 *     components/hooks that want their own instance (the @supabase/ssr pattern,
 *     mirrors `server.ts`).
 *   - `getSupabase()` — shared, cached, *fail-loud* data client. Centralizes
 *     env validation in one place so a deploy missing NEXT_PUBLIC_SUPABASE_URL /
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY fails loudly in production instead of
 *     returning a silent `null` and shipping a half-broken UX. Uses the plain
 *     isomorphic client so it runs in node (tests/SSR) without DOM globals.
 *
 * The anon key reaches the browser. ANY table these clients touch MUST have
 * RLS policies enabled — see `docs/specs/supabase-rls.sql`.
 */

export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let cached: SupabaseClient | null | undefined

function isProductionLike(): boolean {
  // Re-read env at call time so tests can flip it without re-importing.
  // Railway sets NODE_ENV=production on deploy; that is our prod signal.
  return process.env.NODE_ENV === 'production'
}

export interface SupabaseEnvReport {
  ok: boolean
  missing: string[]
}

export function checkSupabaseEnv(): SupabaseEnvReport {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missing: string[] = []
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!key) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return { ok: missing.length === 0, missing }
}

export class SupabaseEnvMissingError extends Error {
  constructor(missing: string[]) {
    super(
      `Supabase env missing: ${missing.join(', ')}. ` +
        `Set both in the environment (Railway → Variables, or .env.local for dev).`
    )
    this.name = 'SupabaseEnvMissingError'
  }
}

/**
 * Shared, cached Supabase browser client.
 *
 * - In production (NODE_ENV=production, i.e. Railway deploy) missing env
 *   throws immediately so the deploy fails loudly instead of returning a
 *   silent `null`.
 * - In dev / test, missing env logs one warning and returns null so feature
 *   code can short-circuit (offline mode).
 *
 * Reset between tests with `_resetSupabaseClientForTests()`.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached

  const report = checkSupabaseEnv()
  if (!report.ok) {
    if (isProductionLike()) {
      throw new SupabaseEnvMissingError(report.missing)
    }
    if (typeof console !== 'undefined') {
      console.warn(
        `[supabase] missing env (${report.missing.join(', ')}); ` +
          `online features disabled in this dev session.`
      )
    }
    cached = null
    return cached
  }

  cached = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return cached
}

/** Test-only: drop the cached client + cached env decision. */
export function _resetSupabaseClientForTests(): void {
  cached = undefined
}
