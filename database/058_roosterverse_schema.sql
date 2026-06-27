-- 058_roosterverse_schema.sql
-- RoosterVerse / u2games game schema (docs/specs/database-schema.md).
-- Applied to the Supabase project on 2026-06-27. Tables are rv_* prefixed so
-- they coexist with the other app's tables in the shared project.

CREATE TABLE IF NOT EXISTS public.rv_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR(50),
  rooster_coins INT DEFAULT 0 CHECK (rooster_coins >= 0),
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  current_chapter INT DEFAULT 0,
  current_season INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rv_roosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.rv_users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  stats JSONB NOT NULL,
  style JSONB NOT NULL,
  lom_type VARCHAR(20) DEFAULT 'spirit',
  lom_level INT DEFAULT 1,
  power_rating INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  for_sale BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rv_battle_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.rv_users(id),
  rooster_id UUID REFERENCES public.rv_roosters(id),
  opponent_data JSONB NOT NULL,
  won BOOLEAN NOT NULL,
  coins_wagered INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  chapter_id INT,
  stats JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rv_story_progress (
  user_id UUID PRIMARY KEY REFERENCES public.rv_users(id),
  season INT DEFAULT 1,
  completed_chapters INT[] DEFAULT '{}',
  unlocked_moves TEXT[] DEFAULT '{}',
  collected_facts TEXT[] DEFAULT '{}',
  partner_sync_scores JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rv_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.rv_users(id),
  item_id VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity >= 0),
  metadata JSONB DEFAULT '{}',
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.rv_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.rv_users(id),
  item_type VARCHAR(20) NOT NULL,
  item_ref_id UUID NOT NULL,
  price INT NOT NULL CHECK (price > 0),
  status VARCHAR(20) DEFAULT 'listed',
  buyer_id UUID REFERENCES public.rv_users(id),
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rv_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.rv_users(id),
  quest_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  progress JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, quest_id)
);

-- Atomic RC update used by the battle route (api-routes.md). Locked down in
-- 060 so only the service role can call it.
CREATE OR REPLACE FUNCTION public.increment_coins(user_id UUID, amount INT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.rv_users SET rooster_coins = rooster_coins + amount WHERE id = user_id;
$$;
