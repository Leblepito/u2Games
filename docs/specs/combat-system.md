# ⚔️ Combat System Specification

## Overview
Turn-based 1v1 (S1) and 2v2 partner (S2) rooster battles.
XState manages phase flow, Zustand holds combat data.

## Phase Flow (XState)
```
battleStart
  → turnCycle
    → determineTurnOrder (speed-based)
    → playerTurn
      → selectAction
      → selectTarget (if applicable)
      → confirmAction
    → executeAction
      → playAnimation (invoke: Promise)
      → resolveDamage
      → applyBuffs
    → checkBattleEnd
      → victory | defeat | nextTurn
```

## Moves (S1)
| Move | Damage | Stamina | Cooldown | Accuracy |
|------|--------|---------|----------|----------|
| Peck | 0.6× | 8 | 0 | 95% |
| Wing Strike | 1.0× | 15 | 1 turn | 85% |
| Heavy Kick | 1.8× | 25 | 2 turns | 65% |
| Dodge | 0× | 10 | 2 turns | 100% |
| Taunt | 0× | 5 | 3 turns | 100% |
| Fury | 2.5× | 40 | 3 turns | 55% |

## S2 Additional Moves
| Move | Damage | Stamina | Unlock | Note |
|------|--------|---------|--------|------|
| Counter | 1.2× | 20 | Ch5 | Activates on next enemy attack |
| Heal | 0× | 30 | Ch6 | Restore 20% HP |
| Shield | 0× | 15 | Ch7 | Block next hit (50% reduction) |
| Fire Burst | 2.0× | 35 | Ch16 | Fire element bonus |
| Wind Read | 0× | 10 | Ch18 | Reveal enemy next move |
| Golden Flame | 3.0× | 50 | Ch21 | Requires 90+ partner sync |

## Lom Element System (S2)
- Types: Water > Fire > Wind > Earth > Water
- Spirit: neutral to all, amplified by partner sync
- Partner Lom Sync: 0-100
  - Same-type coordinated attack: +10
  - Protective move for partner: +15
  - 3 consecutive coordinated turns: +20
  - Partner takes damage: -5

## Damage Formula
```
baseDamage = attackerATK × moveDamageMultiplier
elementBonus = lomMultiplier(attacker.lom, defender.lom)
defense = defenderDEF × (1 + buffModifier)
finalDamage = max(1, floor((baseDamage × elementBonus) - defense))
critical = random() < 0.1 ? finalDamage × 1.5 : finalDamage
```

## AI Difficulty
- Easy: 60% random, 40% smart
- Normal: full decision tree
- Hard: counter-pattern selection + punish low stamina
