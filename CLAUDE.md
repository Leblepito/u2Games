# u2Games / RoosterVerse

3D turn-based RPG browser game. Raise roosters, battle across SE Asia, earn coins.

## Tech Stack
- **Frontend:** Next.js 15 App Router + React Three Fiber 9 + Drei + Zustand + Tailwind + Radix UI
- **3D:** Three.js r170+ · Meshy.ai GLB assets · gltfjsx for components
- **Combat:** XState (phase flow) + Zustand (combat data)
- **Audio:** Howler.js
- **Backend:** Vercel Serverless Functions (`src/app/api/**` — Next.js route handlers, TypeScript)
- **Database:** Supabase PostgreSQL + Auth + Realtime
- **Deploy:** Vercel (frontend + API) — single platform

## Commands
```bash
npm run dev         # Next.js dev server (port 3000)
npm run build       # Production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
```

## Critical Rules

### Backend / API
- **No Railway. No FastAPI.** All backend logic lives in `src/app/api/**` as Next.js route handlers
- Use `src/lib/supabase/server.ts` (service role) in API routes — never the browser client
- Use `src/lib/supabase/client.ts` (anon key) in React components
- Row Level Security enabled on all tables — server routes use service role to bypass where needed
- All RC mutations go through server — never trust client-side coin math

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
- `src/app/api/` → Backend Agent
- `src/game/combat/` → Combat Agent
- `src/game/story/` + `docs/gdd/` → Story Agent
- `src/game/scenes/` + `src/game/characters/` + `src/assets/` → 3D Agent
- `src/game/systems/` + `database/` → Backend Agent
- `src/components/ui/` → Frontend Agent
- `src/components/canvas/` → 3D Agent
- `src/lib/supabase/` → Backend Agent

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

## API Routes (Vercel Serverless)
```
GET/POST  /api/roosters           → List / create roosters
PATCH/DEL /api/roosters/[id]      → Update / delete rooster
GET/POST  /api/battles            → Battle history / submit battle result
GET       /api/wallet             → RC balance + level
GET/POST  /api/story              → Story progress / complete chapter
GET       /api/leaderboard        → Top 100 players
GET/POST  /api/marketplace        → Browse / list items
DEL       /api/marketplace/[id]   → Cancel listing
POST      /api/breeding           → Breed two roosters (costs 200 RC)
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MESHY_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

## Architecture Docs
- @docs/gdd/story-bible-s1.md — Season 1 story
- @docs/gdd/story-bible-s2.md — Season 2 story
- @docs/gdd/characters.md — Character profiles
- @docs/gdd/economy.md — Economy design
- @docs/specs/combat-system.md — Combat state machine spec
- @docs/specs/lom-system.md — Lom energy element system (S2)
- @docs/specs/database-schema.md — Supabase schema
- @docs/specs/api-routes.md — API spec

## Economy Quick Ref
- **RoosterCoin (RC):** earned via arena wins, quests, breeding sales, item trade
- No real-money exchange
- Arena bet: wager RC → win = 2× return, lose = forfeit
- Quest rewards: RC + XP + items
- Breeding: 2 roosters → new rooster (cost: 200 RC + cooldown)
- Marketplace: player-to-player trading
