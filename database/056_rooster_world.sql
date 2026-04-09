-- Migration 056: RoosterVerse — 3D MMORPG Game System
-- Date: 2026-03-25
-- Tables: characters, inventory, catalog, family, quests, arena matches, arena bets

-- ============================================================
-- 1. ROOSTER CHARACTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_character (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(30) NOT NULL,
    breed           VARCHAR(20) NOT NULL DEFAULT 'betong',
    gender          VARCHAR(6) NOT NULL DEFAULT 'male',   -- male / female

    -- Stats (1-100)
    strength        INT NOT NULL DEFAULT 10,
    agility         INT NOT NULL DEFAULT 10,
    charm           INT NOT NULL DEFAULT 10,
    wisdom          INT NOT NULL DEFAULT 10,
    vitality        INT NOT NULL DEFAULT 10,

    -- Needs (0-100, decay over time)
    hunger          INT NOT NULL DEFAULT 100,
    cleanliness     INT NOT NULL DEFAULT 100,
    energy          INT NOT NULL DEFAULT 100,
    happiness       INT NOT NULL DEFAULT 100,

    -- Progression
    level           INT NOT NULL DEFAULT 1,
    xp              INT NOT NULL DEFAULT 0,
    generation      INT NOT NULL DEFAULT 1,
    prestige        INT NOT NULL DEFAULT 0,

    -- Combat stats (derived from base stats + equipment)
    win_count       INT NOT NULL DEFAULT 0,
    loss_count      INT NOT NULL DEFAULT 0,
    arena_rating    INT NOT NULL DEFAULT 1000,  -- ELO-like

    -- Appearance (JSONB for flexibility)
    appearance      JSONB NOT NULL DEFAULT '{
        "bodyColor": "#d4a574",
        "combColor": "#ff3333",
        "tailColor": "#2a1a0a",
        "beakColor": "#DAA520",
        "legColor": "#FFD700",
        "featherPattern": "solid",
        "combType": "single",
        "tailLength": "medium",
        "bodySize": "medium"
    }',

    -- World position
    pos_x           FLOAT NOT NULL DEFAULT 0,
    pos_y           FLOAT NOT NULL DEFAULT 0.5,
    pos_z           FLOAT NOT NULL DEFAULT 5,
    zone_id         VARCHAR(30) NOT NULL DEFAULT 'village_square',

    -- State
    is_alive        BOOLEAN NOT NULL DEFAULT true,
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_fed_at     TIMESTAMPTZ,
    last_bathed_at  TIMESTAMPTZ,
    last_rested_at  TIMESTAMPTZ,
    last_breed_at   TIMESTAMPTZ,
    breed_count     INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rv_char_user ON rv_character(user_id);
CREATE INDEX IF NOT EXISTS idx_rv_char_zone ON rv_character(zone_id) WHERE is_alive = true;
CREATE INDEX IF NOT EXISTS idx_rv_char_rating ON rv_character(arena_rating DESC) WHERE is_alive = true;

-- ============================================================
-- 2. ACCESSORY CATALOG (admin-managed item definitions)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_accessory_catalog (
    item_id         VARCHAR(50) PRIMARY KEY,
    item_type       VARCHAR(20) NOT NULL,      -- head, neck, wings, body, feet, special
    name            VARCHAR(60) NOT NULL,
    description     TEXT,
    price_u2coin    DECIMAL(12,2) NOT NULL,
    stat_bonus      JSONB NOT NULL DEFAULT '{}',  -- {"strength": 5, "agility": 3}
    combat_bonus    JSONB NOT NULL DEFAULT '{}',  -- {"attack": 2, "defense": 1}
    required_level  INT NOT NULL DEFAULT 1,
    required_plan   VARCHAR(10) NOT NULL DEFAULT 'free',
    rarity          VARCHAR(12) NOT NULL DEFAULT 'common',  -- common, uncommon, rare, epic, legendary
    is_available    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. PLAYER INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id    UUID NOT NULL REFERENCES rv_character(id) ON DELETE CASCADE,
    item_id         VARCHAR(50) NOT NULL REFERENCES rv_accessory_catalog(item_id),
    equipped        BOOLEAN NOT NULL DEFAULT false,
    durability      INT NOT NULL DEFAULT 100,   -- 0-100, degrades with arena use
    purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(character_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_rv_inv_char ON rv_inventory(character_id);

-- ============================================================
-- 4. FAMILY TREE (breeding records)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_family (
    child_id        UUID PRIMARY KEY REFERENCES rv_character(id) ON DELETE CASCADE,
    parent1_id      UUID NOT NULL REFERENCES rv_character(id),
    parent2_id      UUID NOT NULL REFERENCES rv_character(id),
    born_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. EGGS (incubating)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_egg (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    parent1_id      UUID NOT NULL REFERENCES rv_character(id),
    parent2_id      UUID NOT NULL REFERENCES rv_character(id),
    rarity          VARCHAR(12) NOT NULL DEFAULT 'common',
    hatch_at        TIMESTAMPTZ NOT NULL,
    hatched         BOOLEAN NOT NULL DEFAULT false,
    child_id        UUID REFERENCES rv_character(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rv_egg_owner ON rv_egg(owner_id) WHERE hatched = false;

-- ============================================================
-- 6. QUEST PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_quest_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id    UUID NOT NULL REFERENCES rv_character(id) ON DELETE CASCADE,
    quest_id        VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, abandoned
    progress_data   JSONB NOT NULL DEFAULT '{}',
    xp_rewarded     INT NOT NULL DEFAULT 0,
    coin_rewarded   DECIMAL(12,2) NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE(character_id, quest_id)
);

-- ============================================================
-- 7. ARENA MATCHES (virtual cockfighting — replaces real fights)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_arena_match (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rooster1_id     UUID NOT NULL REFERENCES rv_character(id),
    rooster2_id     UUID NOT NULL REFERENCES rv_character(id),
    winner_id       UUID REFERENCES rv_character(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, live, finished, cancelled
    match_type      VARCHAR(20) NOT NULL DEFAULT 'ranked',  -- ranked, friendly, tournament
    round_count     INT NOT NULL DEFAULT 0,
    max_rounds      INT NOT NULL DEFAULT 3,

    -- Combat log (every action recorded)
    combat_log      JSONB NOT NULL DEFAULT '[]',

    -- Rewards
    entry_fee       DECIMAL(12,2) NOT NULL DEFAULT 100,
    winner_prize    DECIMAL(12,2) NOT NULL DEFAULT 180,
    xp_winner       INT NOT NULL DEFAULT 50,
    xp_loser        INT NOT NULL DEFAULT 10,

    -- Rating changes
    rating_change1  INT NOT NULL DEFAULT 0,
    rating_change2  INT NOT NULL DEFAULT 0,

    -- Timestamps
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rv_match_status ON rv_arena_match(status) WHERE status IN ('pending', 'live');
CREATE INDEX IF NOT EXISTS idx_rv_match_r1 ON rv_arena_match(rooster1_id);
CREATE INDEX IF NOT EXISTS idx_rv_match_r2 ON rv_arena_match(rooster2_id);

-- ============================================================
-- 8. ARENA SPECTATOR BETS (viewers bet on matches)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_arena_bet (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES rv_arena_match(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    bet_on          UUID NOT NULL REFERENCES rv_character(id), -- which rooster
    amount          DECIMAL(12,2) NOT NULL,
    odds            DECIMAL(6,3) NOT NULL DEFAULT 1.85,
    payout          DECIMAL(12,2),
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, won, lost, refunded
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rv_bet_match ON rv_arena_bet(match_id);
CREATE INDEX IF NOT EXISTS idx_rv_bet_user ON rv_arena_bet(user_id);

-- ============================================================
-- 9. ARENA LEADERBOARD (cached, updated after each match)
-- ============================================================
CREATE TABLE IF NOT EXISTS rv_arena_leaderboard (
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    period          VARCHAR(10) NOT NULL DEFAULT 'alltime', -- weekly, monthly, alltime
    total_fights    INT NOT NULL DEFAULT 0,
    wins            INT NOT NULL DEFAULT 0,
    losses          INT NOT NULL DEFAULT 0,
    win_rate        DECIMAL(5,2) NOT NULL DEFAULT 0,
    best_rating     INT NOT NULL DEFAULT 1000,
    total_earned    DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, period)
);

-- ============================================================
-- 10. SEED: Default Accessories
-- ============================================================
INSERT INTO rv_accessory_catalog (item_id, item_type, name, description, price_u2coin, stat_bonus, combat_bonus, rarity) VALUES
    -- Head
    ('bamboo_headband', 'head', 'Bamboo Headband', 'Simple bamboo strip, beginner gear', 25, '{"wisdom": 1}', '{}', 'common'),
    ('samurai_helmet', 'head', 'Samurai Kabuto', 'Fearsome warrior helmet', 500, '{"strength": 5, "charm": 3}', '{"attack": 3, "defense": 5}', 'rare'),
    ('phoenix_crown', 'head', 'Phoenix Crown', 'Legendary crown of the Fenghuang', 5000, '{"charm": 10, "wisdom": 8}', '{"attack": 5, "defense": 3}', 'legendary'),
    -- Neck
    ('prayer_beads', 'neck', 'Prayer Beads', 'Temple meditation beads', 30, '{"wisdom": 2}', '{}', 'common'),
    ('jade_pendant', 'neck', 'Jade Pendant', 'Brings fortune and protection', 300, '{"charm": 4, "vitality": 3}', '{"defense": 3}', 'uncommon'),
    ('dragon_collar', 'neck', 'Dragon Collar', 'Fearsome spiked collar', 1500, '{"strength": 6, "agility": 4}', '{"attack": 5, "defense": 2}', 'epic'),
    -- Body
    ('straw_vest', 'body', 'Straw Training Vest', 'Light practice armor', 50, '{"vitality": 2}', '{"defense": 1}', 'common'),
    ('silk_cape', 'body', 'Silk Battle Cape', 'Flowing silk increases dodge chance', 800, '{"agility": 5, "charm": 4}', '{"defense": 2}', 'rare'),
    ('iron_armor', 'body', 'Iron Scale Armor', 'Heavy protection, reduces speed', 2000, '{"vitality": 8, "strength": 5}', '{"defense": 10, "attack": -2}', 'epic'),
    -- Feet
    ('bamboo_wraps', 'feet', 'Bamboo Foot Wraps', 'Basic training wraps', 20, '{"agility": 1}', '{}', 'common'),
    ('steel_talons', 'feet', 'Steel Talons', 'Sharpened steel claw covers', 600, '{"strength": 3, "agility": 2}', '{"attack": 6}', 'rare'),
    -- Wings
    ('feather_guards', 'wings', 'Feather Guards', 'Protective wing shields', 40, '{"vitality": 1}', '{"defense": 1}', 'common'),
    ('golden_wings', 'wings', 'Golden Wing Plates', 'Majestic golden armor for wings', 3000, '{"charm": 8, "strength": 5}', '{"attack": 4, "defense": 4}', 'epic'),
    -- Special
    ('war_paint', 'special', 'War Paint', 'Intimidating facial markings', 100, '{"charm": 3}', '{"attack": 1}', 'uncommon'),
    ('aura_flame', 'special', 'Flame Aura', 'Burning aura surrounds the rooster', 10000, '{"strength": 12, "charm": 10}', '{"attack": 8}', 'legendary')
ON CONFLICT (item_id) DO NOTHING;
