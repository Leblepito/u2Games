# u2Games / RoosterVerse

3D turn-based RPG browser game. Raise roosters, battle across SE Asia, earn coins.

## Tech Stack
- **Frontend:** Next.js 15 App Router + React Three Fiber 9 + Drei + Zustand + Tailwind + Radix UI
- **3D:** Three.js r170+ · Meshy.ai GLB assets · gltfjsx for components
- **Combat:** XState (phase flow) + Zustand (combat data)
- **Audio:** Howler.js
- **Backend:** Next.js API route handlers (`src/app/api/**`, TypeScript) — run inside the Next.js server
- **Database:** Supabase PostgreSQL + Auth + Realtime
- **Deploy:** Railway (Next.js app incl. API routes) · Supabase (Postgres/Auth/Realtime)

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
- **No separate FastAPI service.** All backend logic lives in `src/app/api/**` as Next.js route handlers, deployed with the app on Railway
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

## API Routes (Next.js route handlers)
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

## Three.js r176 Upgrade Checklist (eklendi 2026-04-21)

Şu an `three@0.170`. r176'ya (veya daha yüksek) bump yapmadan önce aşağıdaki 4 taramayı yap; breaking değişiklikler:

1. **LuminanceFormat / LuminanceAlphaFormat kaldırıldı** — `RedFormat` ile değiştir.
   ```bash
   rg -n "LuminanceFormat|LuminanceAlphaFormat" src/
   ```
2. **CapsuleGeometry param rename:** `length` → `height`. Tüm `new CapsuleGeometry(radius, length, ...)` çağrıları güncellenmeli.
   ```bash
   rg -n "CapsuleGeometry" src/
   ```
3. **ArrowHelper cylinder → cone geometry:** hedef geometri artık `ConeGeometry`. Custom shader / raycast parametreleri üstünde etkisi var mı kontrol et.
   ```bash
   rg -n "ArrowHelper" src/
   ```
4. **Package bump yalnızca yukarıdaki 3 taramada temiz sonuç alındıktan sonra:**
   ```bash
   npm install three@^0.176 @react-three/fiber@^9.5 @react-three/drei@latest
   npm run typecheck && npm run build && npm run test
   ```

Rollback: `package.json` + `package-lock.json` git checkout.

**Referans:** Three.js r171–r176 changelog, weekly-ai-evolution 2026-W17 raporu.

### r177 cumulative ek (eklenen 2026-04-29 / W18)

Three.js **r177** yayında. r176 → r177 cumulative değişiklikler — bump tek commit'te r170 → r177 hedefi:

1. **`normalView` → `normalWorld` rename** (TSL — node materials). Custom node material kullanan shader varsa rename gerekiyor.
   ```bash
   rg -n "normalView" src/
   ```
2. **`castShadow` regression fix** — r176'da gelen regresyon r177'de düzeltildi. r176'yı atlayıp doğrudan r177'ye gitmek daha güvenli.
3. **`dashOffset` / LineDashedMaterial fix** — kullanım varsa visual diff kontrol.
4. **`maskNode` ve `shapeCircle()` introduce** — yeni API; mevcut kod etkilenmez.
5. **`toJSON()` / `fromJSON()` methodları eklendi** — serialization akışları için yeni opsiyon (RoosterVerse save/load için potansiyel iyileşme).

Bump komut güncellemesi (cumulative):
```bash
npm install three@^0.177 @types/three@^0.177 @react-three/fiber@^9.5 @react-three/drei@latest
npm run typecheck && npm run build && npm run test
```

**Referans:** Three.js r176 → r177 migration guide (milestone 90), weekly-ai-evolution 2026-W18 raporu.
