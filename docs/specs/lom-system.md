# 🌊 Lom Energy System (Season 2)

## Overview
Lom (Thai: ลม "wind/breath") is the island energy system on Koh Sawan.
Equivalent to Tao in Hell's Paradise — balance of opposites.

## Element Types
```
Water > Fire > Wind > Earth > Water (cycle)
Spirit = neutral to all, amplified by partner sync
```

## Damage Multipliers
| Attacker → Defender | Multiplier |
|---------------------|------------|
| Advantaged (Water→Fire) | 1.5× |
| Disadvantaged (Fire→Water) | 0.7× |
| Neutral | 1.0× |
| Spirit vs any | 1.0× (base), up to 1.8× at 90+ sync |

## Rooster Lom Profiles
```typescript
interface LomProfile {
  primary: "water" | "earth" | "fire" | "wind" | "spirit";
  secondary: LomType | null; // gained from partner
  level: number; // 1-10
}
```

## Partner Sync Mechanics
| Action | Sync Change |
|--------|-------------|
| Same-type coordinated attack | +10 |
| Protective move for partner | +15 |
| 3 consecutive coordinated turns | +20 |
| Partner takes damage | -5 |
| Sync combo executed | -sync threshold |

## Sync Thresholds
| Level | Requirement | Unlocks |
|-------|-------------|---------|
| Basic Combo | 30 sync | Dual attack (1.3× each) |
| Dual Strike | 60 sync | Elemental fusion attack |
| Golden Flame | 90 sync | Ultimate: 3.0× combined |

## Keeper Requirements
Each Keeper requires understanding their philosophy + correct element:
- Water Keeper: fight WITH the flow, not against
- Earth Keeper: sustained pressure, not burst
- Fire Keeper: cold composure defeats rage
- Wind Keeper: sense & read, don't charge blindly
- Spirit Keeper: MUST have partner — solo impossible
