---
name: education-domain-state
description: Current state, key patterns, and completed work in the education & games domain of u2Algo
type: project
---

Education domain is well-structured with:
- `/education/page.tsx` — hub with age tracks, activities, stats, now also leaderboard + progress dashboard
- `/education/school/page.tsx` — full curriculum (6 modules, 22 lessons), now has achievement badge system (8 badges)
- `/education/kids/page.tsx` — bilingual slide-based learning from kids-slides.json (now 15 slides after adding 5 SMC slides in March 2026)
- `/education/games/page.tsx` — games hub with 5 quiz games + 4 arcade games + prediction arena

**Key patterns:**
- XP stored in localStorage via game-engine.ts (getXP, addXP, getLevelInfo)
- Quiz/module completions stored in localStorage key `u2algo_quiz_{module}`
- Badge state in localStorage `u2algo_badge_{id}`
- Daily challenge: `u2algo_challenge_dismissed_{date}` and progress key `u2algo_challenge_{date}`
- Streak days: `u2algo_streak_days`

**Components created 2026-03-18:**
- `frontend/components/education/DailyChallenge.tsx` — dismissible daily challenge banner wired into education layout
- `frontend/components/education/DrWaveChat.tsx` — floating AI tutor chat panel (uses /api/dr-wave)
- `frontend/components/education/EducationNav.tsx` — sticky sub-nav between education sections (hub/school/kids/games)

**Deep UI improvements completed 2026-03-19 (full session):**
- education/page.tsx — ContinueSection, difficulty filter, improved track cards, leaderboard, progress milestones
- education/layout.tsx — added EducationNav
- education/games/page.tsx — full rewrite: 12-game catalog, category filter, difficulty stars, plan badges, high score display
- education/kids/page.tsx — colorful SlideQuiz buttons, StarProgress dots, animated header, bigger nav buttons
- education/school/page.tsx — LessonView prev/next navigation, progress dots, ModuleCard hover animations
- education/games/market-pacman/page.tsx — gradient score panel, dots progress bar
- education/games/predict/page.tsx — gradient header, live price indicator, timer progress bar
- education/games/bot-bet/page.tsx — purple gradient header, yellow wallet badge
- education/games/wallet/page.tsx — large 6xl balance display, gradient stat cards
- education/games/bollinger-storm/page.tsx — lore screen icon box, level badge icon
- education/games/block-master/page.tsx — menu icon box, XP card style, glow button
- education/games/shinobi-temple/page.tsx — lobby icon + gradient button + concept cards with icons, HUD redesign with icon boxes, legend pill badges, scroll reveal compact card, game complete stats + mastery list
- components/education/DailyChallenge.tsx — color themes per challenge type, styled dismiss, streak badge
- components/education/DrWaveChat.tsx — unread badge, timestamps, clearChat, bold markdown, tooltip hint

**Backend (2026-03-20 — Education Hub):**
- `database/postgres/047_education_hub.sql` — tables: u2coin_balances, u2coin_transactions, predictions, prediction_bets, academy_progress, arena_leaderboard
- `ai-engine/src/services/u2coin_service.py` — balance CRUD, credit/debit (atomic), XP conversion (tiered rates), in-memory fallback
- `ai-engine/src/services/academy_service.py` — lesson progress, complete_lesson (idempotent), 5 lesson slugs, 50+50 coin reward
- `ai-engine/src/services/prediction_service.py` — create/bet/resolve binary predictions, 95%/5% pool split, in-memory fallback
- `ai-engine/src/services/prediction_generator.py` — auto-generate predictions for BTC/ETH/SOL/BNB/XRP × 1h/4h/24h
- `ai-engine/src/api/endpoints/education.py` — /education/* router (balance, convert-xp, academy, predictions, leaderboard)
- Registered in main.py: `app.include_router(education_router, prefix="/education", tags=["education"])`
- Tests: test_u2coin_service.py, test_academy_service.py, test_prediction_service.py

**Shared UI components added 2026-03-26:**
- `components/education/LeaderboardTable.tsx` — full leaderboard with podium (2-1-3 visual order), period tabs (Daily/Weekly/Monthly/All Time), rank change arrows (TrendingUp/Down/Minus), current-user highlighting (cyan border + "(You)" badge), level color tiers (gray/green/blue/purple), win rate color coding, streak fire scaling, mobile-responsive (hides Win Rate + Level columns), sticky mobile footer for current user. Exports MOCK_LEADERBOARD_ENTRIES (15 entries, #7 isCurrentUser).

**New reusable game UI components added 2026-03-26 (this session):**
- `components/education/GameCard3D.tsx` — 3D perspective-transform game card. Props: title, description, badge, badgeColor, thumbnailGradient, xpReward, difficulty (Easy/Medium/Hard/Epic color-coded), playerCount, href, locked. Features: CSS perspective hover (rotateY -4deg, scale 1.03), CSS-only depth thumbnail (no images — gradient + grid + radial layers), shimmer keyframe on hover, play overlay on hover, locked grayscale + Pro Required gate, difficulty badge color system, Play Now CTA. Exports: MockGameCard3D (RoosterVerse data), MockGameCardLocked, MockGameCardGrid.
- `components/education/AchievementBadge.tsx` — animated achievement badge. Props: title, description, tier (bronze/silver/gold), icon (emoji), unlocked, unlockedAt, xpReward, progress 0-100, total, current. Features: SVG ring (solid=unlocked, dashed-progress=locked), tier-specific ring colors (#CD7F32/#C0C0C0/#FFD700) + glow, CSS keyframe unlock animation (badge-bounce + glow-burst + ring-expand), 8-direction sparkle particles on unlock, tooltip (description + unlock date or progress bar), grayscale+dimmed when locked, percentage overlay. Exports: MockAchievementGrid (5 badges: 3 unlocked bronze/silver/gold, 2 locked with progress).
- `components/education/LearningPathTimeline.tsx` — vertical learning path timeline. Props: pathTitle, lessons[], totalXP, completedXP. Three lesson states: completed (green glow CheckCircle + strikethrough title + "Completed" badge + green left border), active (cyan pulse BookOpen + "Continue" cyan-gradient Link button + cyan border glow), locked (gray Lock circle + dashed border + 0.4 opacity + "Unlock after completing previous" text). ConnectorLine sub-component renders solid green / gradient green-cyan / dashed gray between nodes based on adjacent statuses. Progress bar in header shows completedXP/totalXP %. Exports MockLearningPathTimeline() with 6-lesson "Trading Fundamentals" path (3 completed, 1 active, 2 locked).
- `components/education/DailyQuestPanel.tsx` — daily quest panel. Props: quests[], streakDays, onClaim?. Auto-updating HH:MM:SS countdown via useCountdown hook (useState + setInterval, expires midnight UTC). Streak badge uses flameSize() to scale emoji/text at streak milestones (7/14/30 days). QuestCard sub-component: cyan progress bar (in-progress) or green (complete), XP in #00f0ff + u2coin in #ffaa00, Claim button (green gradient) transitions to "Claimed" disabled via local Set<string> state. questIcon() maps title keywords (lesson/predict/trade) to lucide icons. Bonus footer row shows +200 XP / +500 coin for all-complete state. Exports MockDailyQuestPanel() (3 quests: 50%/0%/100%, streak 7).

**Phaser game scenes (lib/phaser/scenes/):**
- `BaseGameScene.ts` — abstract base: score, streak, timer (60s), pause, floatingText, cameraShake, createCyanButton(x,y,label,onClick,w,h) → Container
- `BollingerStormScene.ts` — existing
- `MarketPacmanScene.ts` — existing
- `CandleQuizScene.ts` — **created 2026-03-26**: 10-round candle pattern recognition. 15 CANDLE_PATTERNS (procedural Phaser.Graphics). Per-round 15s countdown bar (green→amber→red). 2×2 button grid. +10 per correct, +25 bonus at streak>=5. Buttons closed in roundContainer (removeAll(true) each round). correctButtonIdx tracked so timeout/wrong can highlight correct. EventBus only used for pause-toggle in shutdown cleanup.

- `BlockMasterScene.ts` — **created 2026-03-26**: 12-round SMC order block recognition. Procedural OHLCV chart (40 candles), 3 coloured zones (cyan=order_block, amber=breaker_block, purple=mitigation_block). Difficulty: rounds 1-4 single zone, 5-8 two zones, 9-12 three overlapping. +50 XP correct, +10 speed bonus (<5s). Education card overlay (3s auto-dismiss) between rounds. createColorButton() variant of createCyanButton with per-type accent color. Zone labels are alphabetic (A/B/C). flashZone() + flashCorrectZoneHighlight() for feedback. drawZone() helper takes x1,x2,y1,y2.
- `EntrySniperScene.ts` — **created 2026-03-26**: 10-round entry price selection. Click anywhere on OHLC bar chart to set entry; SL drawn at support-1*ATR, TP at 2.5x R:R. Zone scoring: green (±1% support)=+20, yellow (1-3% above support)=+10, red (within 1% resistance)=0+wrongAnswer(). R:R badge rendered at click point. Right sidebar (128px) shows live avg R:R, accuracy %, best entry distance %. chartClickZone is a transparent Rectangle set interactive over chart area. drawDashedLine() helper for SL/TP lines. generateBars() uses 3-up/2-down rhythm. Stats tracked in RunningStats interface.

- `ShinobiTempleScene.ts` — **created 2026-03-26**: 1424-line isometric ninja adventure. 5 levels (Fibonacci Dojo → Wave Garden → Support Castle → RSI Cavern → Final Sanctum). TILE_W=64/TILE_H=32 isometric grid 16×12. cartToIso/isoToCart exported. TileTypes: EMPTY/WALL/LIQUIDITY_TRAP/ORDER_BLOCK/GOLDEN_GEM/DEAD_ZONE/CHAKRA_ORB/FIBONACCI_TOKEN(labeled)/EXIT/WAVE_MARKER/WAVE_LABEL. Ninja: procedural Graphics (cyan diamond body, white head circle, amber sword line). Movement: WASD+Arrows, 8-direction, tween interpolation, inputCooldown 30ms. Status effects: boost 80ms/tile (5s), slow 300ms/tile (2s). RSI tide (level 4): 3s cycle, overbought phase mutates rows 1-2 to DEAD_ZONE temporarily. Ordered collection: Fibonacci tokens (FIB_LABELS) and Wave markers (WAVE_LABELS) must be collected in sequence or wrongAnswer(). Painter's algorithm: tiles sorted by isoY before drawing. Level transitions: intro overlay → playing → levelcomplete (star rating: <30s=3★, <60s=2★, else 1★) → advanceLevel or gameOver. Mobile 8-direction D-pad (isMobile only). gameOver override adds +50 XP per level reached. tileGraphics typed as Array<Container | Graphics>. isoToCart and DIRECTIONS exported for extensions.

**Phaser pattern notes:**
- Scenes import from `../utils/theme` (COLORS, HEX_COLORS, FONTS) — no createParticleBurst needed if only using base addScore
- createCyanButton hit area is Phaser.Geom.Rectangle; recover w/h via `btn.input?.hitArea as Phaser.Geom.Rectangle`
- roundContainer.each() iterates ALL children including Graphics — filter with `instanceof Phaser.GameObjects.Container` to get only buttons
- priceToY / yToPrice helpers need explicit ChartDimensions passed every call — do not cache single global
- For click-on-chart interactions: use transparent Rectangle.setInteractive() at chart bounds rather than scene-level input.on("pointerdown")
- Isometric scenes: use `isoContainer` (Container at screen center) as parent for all tile/player objects. Tile depth = isoY value (painter sort). Player depth = isoY + 100 to always float above tiles. `tileGraphics` must be typed as `Array<Container | Graphics>` since floor tiles use Graphics and special tiles use Container.

**RoosterVerse PvP combat system (lib/rooster-world/ — this session):**
- `lib/rooster-world/battle.ts` — Full turn-based PvP engine. Types: ActionType, BattleAction, Buff, StatusEffect, BattleLogEntry, FighterState, PvpBattleState (named to avoid collision with legacy BattleState in types.ts). Core exports: createFighterState, calculateDamage, resolveActions, applyBuffs, checkCombo, checkGameOver, getAIAction (easy/medium/hard), calculateRewards, createBattleState. RPS interaction layer (resolveRPS): Attack>Dodge×1.3, Dodge>Skill(wasted), Skill>Defend(bypass), Defend>Attack(60% reduction+30% counter). STA costs: attack=10, defend=5+3regen, skill=15+tier×5, dodge=8. Combo at every 3 consecutive hits = +50% damage. AI difficulty: easy=random, medium=HP-threshold+skill logic, hard=optimal counter to player.lastAction. DamageResult includes isCrit+isDodged flags.
- `lib/rooster-world/matchmaking.ts` — ELO system. Types: RankTier, MatchResult, MatchRange. RANK_TIERS: Bronze(0-1099), Silver(1100-1299), Gold(1300-1499), Platinum(1500-1699), Diamond(1700-1899), Champion(1900+). Exports: calculateElo(k=32), calculateEloAuto (auto k-factor by tier), getRankTier, eloToNextTier, tierProgress, getMatchRange (±100@0s, ±200@10s, ±500@20s, ±1000@30s+), isInMatchRange, formatEloDelta, getSubRankLabel (Bronze III/II/I sub-ranks).
- `lib/rooster-world/tournament.ts` — Bracket tournament system. Types: BracketSize(8|16|32), Tournament, TournamentParticipant, BracketMatch. Exports: createTournament, joinTournament, startTournament, generateBracket (ELO-seeded standard pairing, auto-advances byes), advanceWinner (cascades rounds, detects final), calculatePrizes (50%/25%/12.5%/12.5%), getTournamentRound, getCompletedMatches, getTournamentChampion. MOCK_TOURNAMENTS: Daily Brawl (8-player, 50 coin, lobby), Weekly Championship (16-player, 200 coin, active with round 1 half-done), Grand Phoenix (32-player, 1000 coin, lobby with 20 registered).

**RoosterVerse open world data layer (this session):**
- `lib/rooster-world/zones.ts` — 8 Zone definitions (niwatori_village, dragon_market, bamboo_forge, lotus_springs, rice_valley, shadow_temple, phoenix_arena, dragon_peak). Full ZoneStructure + ZoneVegetation arrays per zone, ambientColor, fogDensity, groundColor, spawnPoint, requiredLevel (1/5/10/15/50). Exports: ZONES, getZoneById, getZoneByName.
- `lib/rooster-world/npcs.ts` — Full rewrite. 7 NPCDef entries with rich DialogNode[] trees (3-6 nodes each, `id` field), ShopItem[] inventories, NPCScheduleEntry[] schedules (5-6 entries), RelationLevel[] (Stranger/Friendly/Trusted with discounts 0/5/15%). New exported `NPCS` array + getNPCById + getNPCsByZone + getAllNPCs (backwards compatible). DialogChoice uses `text` field (was `label`) and `nextNodeId: string | null`.
- `lib/rooster-world/items.ts` — Full rewrite. ItemDef interface (id, description, statBonus as Record<string,number>, special?, duration?). 20 items across 4 categories: spur(5), armor(5), food(5), accessory(5). Full lore text per item. Exports: ITEMS, getItemById, getItemsByCategory, getItemsByTier, getItemsByIds, RARITY_COLORS, RARITY_STARS.
- Breaking change migration: updated DialogSystem.tsx (choice.label→text, dialogTree Record lookup map from array, npcType→shopType, initial node "greeting"→"root"), ShopPanel.tsx (item.itemId→item.id, statBonuses+combatBonus→statBonus, specialAbility→special, npc.inventory ShopItem[] extraction).

**RoosterVerse quest data layer (this session):**
- `lib/rooster-world/quests.ts` — Full quest catalog (~430 lines). Exports: STORY_QUESTS (20 quests, "Phoenix's Path" main storyline — story_01 through story_20, chained prerequisites, level gates 1–50), DAILY_QUEST_POOL (8 quests: morning_training, feed_rooster, arena_practice, social_butterfly, explorer, shopkeeper_friend, skill_seeker, combo_master), NPC_QUEST_CHAINS (9 quests — 3 per NPC: tanaka_01/02/03 "Way of the Claw" chain, kang_01/02/03 "Apprentice Smith" chain, ryuu_01/02/03 "Scroll of Shadows" chain). Exports: getAllQuests, getQuestById, getDailyQuests (deterministic daily 3-pick using UTC date as LCG seed — Fisher-Yates shuffle). Quest interface: id, title, description, category, npcId?, zone, requiredLevel, prerequisites[], objectives (QuestObjective[]), rewards (QuestRewards with xp/gold/u2coin?/items?/unlocks?/badge?/title?), repeatable, timeLimit?, lore?.
- `lib/rooster-world/trading-quests.ts` — 5 trading education quests (~260 lines). TradingQuest interface matches prompt spec exactly (gameType union, passThreshold, questions optional). Quests: trading_rsi_meditation (Sage Ryuu, shadow_temple, level 10, 5 rounds, 60% pass), trading_fibonacci_temple (Elder Longwei, dragon_peak, level 20, 6 rounds, 65% pass), trading_bollinger_storm (Master Kang, bamboo_forge, level 15, 8 rounds, 55% pass), trading_elliott_path (Sensei Tanaka, niwatori_village, level 25, 5 rounds, 60% pass), trading_risk_dojo (Nurse Hana, lotus_springs, level 30, 5 rounds, 80% pass — full 5 questions with position sizing/EV/R:R/kill-switch/Half-Kelly with correct indices and formula explanations). Exports: TRADING_QUESTS, getTradingQuestById.

**Why:** Platform-wide education push to increase engagement, retention (streaks), and learning quality (AI tutor).

**How to apply:** Use localStorage keys above when adding new features that need to integrate with existing XP/progress systems. Always add DrWaveChat to new education pages. kids-slides.json languages: en, tr, th, ru, zh, es. Backend services use in-memory fallback when db_pool.is_in_memory=True — tests always set db_pool._in_memory=True and reset module-level _mem_store.
