-- 059_roosterverse_rls.sql
-- Row-Level Security for the rv_* tables (docs/specs/supabase-rls.sql).
-- The anon key ships to the browser, so every client-reachable table needs
-- RLS. Server API routes use the service role and bypass these policies.

ALTER TABLE public.rv_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_roosters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_marketplace    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_quests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rv_story_progress ENABLE ROW LEVEL SECURITY;

-- Per-user ownership: read/write only your own row.
DROP POLICY IF EXISTS "rv_users: own row" ON public.rv_users;
CREATE POLICY "rv_users: own row" ON public.rv_users
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "rv_roosters: own rooster" ON public.rv_roosters;
CREATE POLICY "rv_roosters: own rooster" ON public.rv_roosters
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- battle_results: read all (leaderboard), insert own only.
DROP POLICY IF EXISTS "rv_battle_results: read any" ON public.rv_battle_results;
CREATE POLICY "rv_battle_results: read any" ON public.rv_battle_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rv_battle_results: insert own" ON public.rv_battle_results;
CREATE POLICY "rv_battle_results: insert own" ON public.rv_battle_results
  FOR INSERT WITH CHECK (player_id = auth.uid());

-- story_progress / inventory / quests: per-user own row.
DROP POLICY IF EXISTS "rv_story_progress: own row" ON public.rv_story_progress;
CREATE POLICY "rv_story_progress: own row" ON public.rv_story_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rv_inventory: own row" ON public.rv_inventory;
CREATE POLICY "rv_inventory: own row" ON public.rv_inventory
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rv_quests: own row" ON public.rv_quests;
CREATE POLICY "rv_quests: own row" ON public.rv_quests
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- marketplace: anyone reads listed items, owner writes own.
DROP POLICY IF EXISTS "rv_marketplace: read listed" ON public.rv_marketplace;
CREATE POLICY "rv_marketplace: read listed" ON public.rv_marketplace
  FOR SELECT USING (status = 'listed');

DROP POLICY IF EXISTS "rv_marketplace: write own" ON public.rv_marketplace;
CREATE POLICY "rv_marketplace: write own" ON public.rv_marketplace
  FOR ALL USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());
