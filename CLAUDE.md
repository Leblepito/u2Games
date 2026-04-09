# u2Games / RoosterVerse

3D turn-based RPG browser game. Raise roosters, battle across SE Asia, earn coins.

## Tech Stack
- **Frontend:** Next.js 15 App Router + React Three Fiber 9 + Drei + Zustand + Tailwind + Radix UI
- **3D:** Three.js r170+ · Meshy.ai GLB assets · gltfjsx for components
- **Combat:** XState (phase flow) + Zustand (combat data)
- **Audio:** Howler.js
- **Backend:** FastAPI on Railway · PostgreSQL on Supabase
- **Deploy:** Vercel (frontend) · Railway (backend)

## Commands
```bash
npm run dev         # Next.js dev server (port 3000)
npm run build       # Production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
```

## Critical Rules

### R3F / Next.js
- Every R3F component MUST have `"use client"` directive
- Canvas components MUST use `next/dynamic` with `ssr: false`
- NEVER call `setState` inside `useFrame` — mutate refs directly
- Use `useGameStore.getState()` for reading inside animation loops
- One persistent `<Canvas>` in `layout.tsx`, scenes swap inside it

### TypeScript
- Strict mode, no `any`
- Explicit return types on exported functions
- Barrel exports via `index.ts` per module

### File Ownership (for parallel agents)
- `src/app/` → Frontend Agent
- `src/game/combat/` → Combat Agent
- `src/game/story/` + `docs/gdd/` → Story Agent
- `src/game/scenes/` + `src/game/characters/` + `src/assets/` → 3D Agent
- `src/game/systems/` + `database/` → Backend Agent
- `src/components/ui/` → Frontend Agent
- `src/components/canvas/` → 3D Agent

### Git
- Branch naming: `agent/<role>/<feature>` (e.g. `agent/combat/partner-system`)
- Commit format: `feat(combat): add partner sync mechanic`
- Never push directly to `main` — PR only

### Performance Targets
- Draw calls: < 100/frame
- Lights: ≤ 3 active
- GLB models: < 2MB each (after gltfjsx --transform)
- Textures: 1024×1024 max (512 for mobile)
- 60fps on mid-range mobile

## Architecture Docs
- @docs/gdd/story-bible-s1.md — Season 1 story (Naruto-inspired)
- @docs/gdd/story-bible-s2.md — Season 2 story (Hell's Paradise-inspired)
- @docs/gdd/characters.md — All character profiles
- @docs/gdd/economy.md — In-game economy design
- @docs/specs/combat-system.md — Combat state machine spec
- @docs/specs/lom-system.md — Lom energy element system (S2)
- @docs/specs/database-schema.md — Supabase schema
- @docs/specs/api-routes.md — Backend API spec

## Reference Repos (clone & study before starting)
```bash
git clone https://github.com/anthropics/anthropic-cookbook.git
git clone https://github.com/anthropics/courses.git
```

## Economy Quick Ref
- **RoosterCoin (RC):** earned via arena wins, quests, breeding sales, item trade
- No real-money exchange
- Arena bet: wager RC, win = 2× return
- Quest rewards: RC + XP + items
- Breeding: combine 2 roosters → new rooster (sellable)
- Marketplace: player-to-player item/rooster trading
