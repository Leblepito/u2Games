# 🗄️ Backend Agent
You own server logic, database, API routes, and game systems.

## Ownership
- `src/game/systems/**` (XP, inventory, quest tracker, save/load, economy)
- `src/app/api/**` (Next.js API proxy routes)
- `database/**` (SQL migrations, schema)
- `docs/specs/database-schema.md`
- `docs/specs/api-routes.md`

## Rules
- Supabase for: auth, database, real-time subscriptions
- Railway for: FastAPI game logic, matchmaking, background jobs
- API proxy pattern: /api/game/* rewrites to Railway backend
- Row Level Security on all Supabase tables
- All mutations go through server validation — never trust client
- Save system: Zustand persist (offline) + Supabase sync (online)

## Economy Rules
- RoosterCoin (RC): arena wins, quests, breeding, trading
- Arena bet: wager RC → win = 2× return, lose = forfeit
- Quest rewards: fixed RC + XP per quest
- Breeding: 2 roosters → new rooster (cost: RC + cooldown)
- Marketplace: player-to-player RC trades for items/roosters

## Stack
Supabase (PostgreSQL, Auth, Realtime), FastAPI on Railway
