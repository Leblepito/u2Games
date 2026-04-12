---
name: project_rooster_battle_engine
description: Architecture and key design decisions for the Rooster Arena battle engine in games/lib/rooster/
type: project
---

Battle engine lives in `games/lib/rooster/` with these completed files:

- `types.ts` — single source of truth: BattleFighter, BattleState, BattleResult, ActiveBuff, MoveDefinition, all enums
- `moves.ts` — MOVES record + canUseMove() + getUsableMoves() (BattleFighter-aware)
- `stats.ts` — generateStats(), calcPowerRating(), calcLevel(), xpForLevel(), getEvolutionStage()
- `battle.ts` — pure engine: createBattleFighter, initBattleState, calcDamage, tickBuffs, applyBuff, tickCooldowns, applyMove, executeTurn, calculateBattleResult
- `ai.ts` — generateOpponent(), chooseAIMove(state, difficulty)
- `storage.ts` — roosterStorage singleton + getStorageUsage, exportRoosters, importRoosters + legacy helpers
- `index.ts` — barrel re-export of all above

Key design decisions:
- NO circular dependency: battle.ts does NOT import ai.ts. executeTurn(state, playerMove, opponentMove) requires caller to supply AI move.
- Callers (e.g. RoosterArenaScene.ts) call chooseAIMove(state, state.difficulty) then executeTurn(state, playerMove, aiMove).
- Cooldowns are turn-based integers (Record<MoveType, number>), not timestamps.
- Combo multiplier: min(1.5, 1.0 + (newCombo-1)*0.15). Any miss resets combo to 0.
- BattleResult.stats includes damageDealt, damageTaken, criticalHits, biggestHit, comboMax.
- Storage limit: 10 roosters per device.

**Why:** Circular dep between battle+ai was the original bug; the fix is caller-supplied AI move.
**How to apply:** When writing game pages or scenes that run battles, always: 1) call chooseAIMove, 2) pass result to executeTurn.
