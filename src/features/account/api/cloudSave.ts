/**
 * Supabase-backed cloud save. Every entry point is offline-safe: when
 * `getSupabase()` returns null (env not configured) the calls no-op so the game
 * keeps running purely on localStorage.
 *
 * Auth is anonymous: the player gets a Supabase anonymous user (no signup) which
 * gives a stable `auth.uid()` for RLS. NOTE: "Anonymous sign-ins" must be enabled
 * in the Supabase project's Auth settings for this to work at runtime.
 */

import { getSupabase } from "@/lib/supabase";
import {
  snapshotToUserRow,
  snapshotToStoryRow,
  type ProfileSnapshot,
  type RvUserRow,
  type RvStoryRow,
} from "../lib/mappers";

export interface PushResult {
  ok: boolean;
  reason?: "offline" | "error";
}

export interface RemoteRows {
  user: RvUserRow | null;
  story: RvStoryRow | null;
}

/** Returns the player's user id, creating an anonymous session if needed. Null offline. */
export async function ensureSession(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: sessionData } = await sb.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user.id;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) return null;
  return data.user.id;
}

/** Read the player's rows. Null offline; individual rows null if absent. */
export async function pullRows(userId: string): Promise<RemoteRows | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const [u, s] = await Promise.all([
    sb.from("rv_users").select("*").eq("id", userId).maybeSingle(),
    sb.from("rv_story_progress").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    user: (u.data as RvUserRow | null) ?? null,
    story: (s.data as RvStoryRow | null) ?? null,
  };
}

/** Upsert the player's snapshot to both rows. */
export async function pushSnapshot(userId: string, snap: ProfileSnapshot): Promise<PushResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: "offline" };

  const { error: userErr } = await sb
    .from("rv_users")
    .upsert(snapshotToUserRow(userId, snap));
  const { error: storyErr } = await sb
    .from("rv_story_progress")
    .upsert(snapshotToStoryRow(userId, snap));

  if (userErr || storyErr) return { ok: false, reason: "error" };
  return { ok: true };
}
