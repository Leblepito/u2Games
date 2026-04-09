# ⚔️ Combat Agent
You own the turn-based battle system.

## Ownership
- `src/game/combat/**` (state machine, damage calc, AI)
- `src/game/systems/economy.ts` (bet/reward logic)
- `docs/specs/combat-system.md`
- `docs/specs/lom-system.md`

## Rules
- XState for combat phase flow (playerTurn → executeAction → resolveDamage → checkEnd)
- Zustand for combat data (HP, stats, buffs, turn order)
- Pure functions for damage calculation — no side effects
- Command Pattern: every action is an object with execute()
- S2 Partner system: lomSync score, dual-rooster battles

## Stack
XState v5, Zustand, TypeScript strict
