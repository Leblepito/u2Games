-- Migration 057: RoosterVerse Food Items + NPCs
-- Date: 2026-03-25
-- Author: u2Algo

-- ============================================================
-- FOOD ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_food_item (
    item_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    hunger_restore INT NOT NULL DEFAULT 20,
    energy_restore INT NOT NULL DEFAULT 0,
    happiness_restore INT NOT NULL DEFAULT 0,
    stat_boost_type TEXT,
    stat_boost_amount INT DEFAULT 0,
    price_u2coin INT NOT NULL DEFAULT 5,
    rarity TEXT NOT NULL DEFAULT 'common',
    origin_zone TEXT
);

-- ============================================================
-- NPCs
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_npc (
    npc_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    npc_type TEXT NOT NULL,
    zone TEXT NOT NULL,
    dialogue JSONB,
    inventory JSONB,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rv_npc_zone ON rv_npc(zone);
CREATE INDEX IF NOT EXISTS idx_rv_npc_type ON rv_npc(npc_type);

-- ============================================================
-- SEED: 12 food items
-- ============================================================
INSERT INTO rv_food_item VALUES
('rice_ball', 'Rice Ball', 'Simple but filling rice ball', 25, 5, 5, NULL, 0, 5, 'common', 'village_square'),
('bamboo_shoot', 'Bamboo Shoot', 'Fresh bamboo shoot from the forest', 20, 10, 0, 'agility', 1, 8, 'common', 'bamboo_forest'),
('temple_incense_tea', 'Temple Incense Tea', 'Sacred tea brewed by monks', 10, 30, 15, 'wisdom', 2, 15, 'uncommon', 'mountain_temple'),
('river_fish', 'River Fish', 'Freshly caught river fish', 35, 5, 10, 'strength', 1, 10, 'common', 'river_valley'),
('golden_rice', 'Golden Rice', 'Premium rice from the paddies', 30, 10, 10, 'vitality', 1, 12, 'common', 'rice_paddies'),
('hot_spring_egg', 'Hot Spring Egg', 'Onsen-boiled egg', 20, 20, 20, 'charm', 2, 20, 'uncommon', 'hot_springs'),
('night_market_skewer', 'Night Market Skewer', 'Spicy grilled skewer', 25, 0, 25, 'strength', 2, 15, 'uncommon', 'night_market'),
('arena_power_drink', 'Arena Power Drink', 'Pre-fight energy drink', 10, 40, 0, 'strength', 3, 25, 'rare', 'arena'),
('sakura_mochi', 'Sakura Mochi', 'Cherry blossom flavored mochi', 15, 5, 35, 'charm', 3, 30, 'rare', 'village_square'),
('dragon_fruit', 'Dragon Fruit', 'Mythical fruit said to grant power', 40, 20, 20, 'vitality', 4, 50, 'epic', NULL),
('phoenix_feather_soup', 'Phoenix Feather Soup', 'Legendary soup of immortality', 50, 50, 50, 'vitality', 5, 100, 'legendary', NULL),
('emperors_feast', 'Emperor''s Feast', 'A meal fit for royalty', 60, 40, 40, NULL, 0, 200, 'legendary', NULL)
ON CONFLICT (item_id) DO NOTHING;

-- ============================================================
-- SEED: 8 NPCs (one per zone)
-- ============================================================
INSERT INTO rv_npc VALUES
('npc_village_elder', 'Elder Tanaka', 'quest_giver', 'village_square', '{"greeting": "Welcome to RoosterVerse, young one! Prove yourself worthy..."}', NULL, 5, 0, 5),
('npc_bamboo_merchant', 'Bamboo Li', 'merchant', 'bamboo_forest', '{"greeting": "Fresh goods from the forest!"}', '["bamboo_shoot"]', 15, 0, 20),
('npc_temple_monk', 'Monk Satori', 'trainer', 'mountain_temple', '{"greeting": "Seek wisdom, find strength."}', NULL, 30, 2, 35),
('npc_river_fisher', 'Old Man Koi', 'merchant', 'river_valley', '{"greeting": "The river provides for all."}', '["river_fish"]', -10, 0, -15),
('npc_rice_farmer', 'Farmer Hana', 'merchant', 'rice_paddies', '{"greeting": "Golden harvest awaits!"}', '["golden_rice", "rice_ball"]', -20, 0, 10),
('npc_onsen_keeper', 'Keeper Yuki', 'healer', 'hot_springs', '{"greeting": "Rest your weary feathers..."}', '["hot_spring_egg"]', 25, 0, -25),
('npc_night_vendor', 'Shadow Chef', 'merchant', 'night_market', '{"greeting": "Taste the night!"}', '["night_market_skewer", "sakura_mochi"]', -5, 0, -30),
('npc_arena_master', 'Master Tori', 'trainer', 'arena', '{"greeting": "Only the strongest survive!"}', '["arena_power_drink"]', 0, 0, 45)
ON CONFLICT (npc_id) DO NOTHING;
