---
name: project_edu_games_architecture
description: RoosterVerse component map and key patterns for education/games domain
type: project
---

RoosterVerse lives under `frontend/components/rooster-world/` and is organized by subdomain:

- `arena/` — PvP battle system, matchmaking, tournament bracket
- `breeding/` — FamilyTree (d3-force SVG graph, zoom/pan)
- `multiplayer/` — ChatSystem, MultiplayerManager, OtherRooster
- `npc/` — NPCCharacter, DialogSystem, ShopPanel, NPCAwareness, NPCScheduler
- `player/` — RoosterController, RoosterModel, CameraController
- `quest/` — QuestLog, QuestTracker, QuestReward, TradingQuestGame
- `scene/` — Ground, Lighting, Skybox, Vegetation, DayNightCycle
- `ui/` — GameHUD, BreedingPanel, ArenaPanel, SkillTreePanel, EquipmentPanel, InventoryGrid, TrainingMiniGame, StatRadarChart, StatsPanel, CharacterCreation, BreedSelector, AppearanceCustomizer, StatPreview, QuestPanel, NPCPanel, LoadingScreen
- `world/` — ZoneManager + 8 zone components (NiwatoriVillage, DragonMarket, BambooForge, LotusSpring, RiceValley, ShadowTemple, PhoenixArena, DragonPeak)

**Why:** Needed for navigation when adding new components to the correct subdirectory.
**How to apply:** Place new components in the correct subdirectory (e.g., breeding-related UI → `breeding/`, combat → `arena/`).
