-- Row-Level Security policies for u2games / RoosterVerse.
--
-- The frontend uses NEXT_PUBLIC_SUPABASE_ANON_KEY which is intentionally
-- shipped to the browser. RLS is the ONLY thing standing between an
-- attacker and the data — every table touched by the anon key MUST have
-- it enabled, and the policies below MUST exist before public traffic
-- is allowed.
--
-- Apply via:  psql "$DATABASE_URL" -f docs/specs/supabase-rls.sql
-- Or paste into Supabase SQL editor.

-- ── lobbies ────────────────────────────────────────────────────────────
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- Anyone can list / read lobbies (lobby browsing is the whole point).
DROP POLICY IF EXISTS "lobbies: anyone can read" ON public.lobbies;
CREATE POLICY "lobbies: anyone can read"
  ON public.lobbies
  FOR SELECT
  USING (true);

-- Anyone can create a lobby. We rely on application-side validation +
-- the unique `code` constraint to prevent collision/abuse.
DROP POLICY IF EXISTS "lobbies: anyone can create" ON public.lobbies;
CREATE POLICY "lobbies: anyone can create"
  ON public.lobbies
  FOR INSERT
  WITH CHECK (true);

-- Updates / deletes require an authenticated host_id matching the row.
-- Until host auth is wired, leave the table append-only and let the
-- backend reaper purge stale rows.
DROP POLICY IF EXISTS "lobbies: host can update own" ON public.lobbies;
CREATE POLICY "lobbies: host can update own"
  ON public.lobbies
  FOR UPDATE
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "lobbies: host can delete own" ON public.lobbies;
CREATE POLICY "lobbies: host can delete own"
  ON public.lobbies
  FOR DELETE
  USING (host_id = auth.uid());

-- ── rv_users / rv_roosters / rv_battle_results ────────────────────────
-- (see docs/specs/database-schema.md — these are the tables already
-- planned; policies provided as a starting point so the tables can't
-- accidentally ship without RLS.)

ALTER TABLE IF EXISTS public.rv_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_roosters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_marketplace  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_quests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rv_story_progress ENABLE ROW LEVEL SECURITY;

-- Per-user row ownership — read/write only your own rows.
-- Adjust to taste once auth shape is final.
DROP POLICY IF EXISTS "rv_users: own row" ON public.rv_users;
CREATE POLICY "rv_users: own row"
  ON public.rv_users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "rv_roosters: own rooster" ON public.rv_roosters;
CREATE POLICY "rv_roosters: own rooster"
  ON public.rv_roosters
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- battle_results: read all (leaderboard), write own only.
DROP POLICY IF EXISTS "rv_battle_results: read any" ON public.rv_battle_results;
CREATE POLICY "rv_battle_results: read any"
  ON public.rv_battle_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rv_battle_results: insert own" ON public.rv_battle_results;
CREATE POLICY "rv_battle_results: insert own"
  ON public.rv_battle_results
  FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- marketplace: read any listed, write own.
DROP POLICY IF EXISTS "rv_marketplace: read listed" ON public.rv_marketplace;
CREATE POLICY "rv_marketplace: read listed"
  ON public.rv_marketplace
  FOR SELECT
  USING (status = 'listed');

DROP POLICY IF EXISTS "rv_marketplace: write own" ON public.rv_marketplace;
CREATE POLICY "rv_marketplace: write own"
  ON public.rv_marketplace
  FOR ALL
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- IMPORTANT: any new table reachable from the client SHOULD be added
-- to this file so deploys can re-apply it as a single source of truth.
