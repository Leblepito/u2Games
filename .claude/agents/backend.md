# 🗄️ Backend Agent
You own server logic, database, API routes, and game systems.

## Ownership
- `src/app/api/**` (Next.js route handlers — all backend logic lives here)
- `src/lib/supabase/` (server + browser clients)
- `src/game/systems/**` (XP, inventory, quest tracker, save/load, economy)
- `database/**` (SQL migrations, schema)
- `docs/specs/database-schema.md`
- `docs/specs/api-routes.md`

## Rules
- **No Railway. No FastAPI.** Backend = Next.js API routes on Vercel
- Use `src/lib/supabase/server.ts` (service role key) in all API routes
- Use `src/lib/supabase/client.ts` (anon key) only in React components
- Row Level Security on all Supabase tables
- All RC mutations are server-side — never trust client coin math
- Use Supabase Realtime for live updates (battle sync, marketplace)
- Save system: Zustand persist (offline) + Supabase sync (online)

## Economy Rules
- RoosterCoin (RC): arena wins, quests, breeding, trading
- Arena bet: wager RC → win = 2× return, lose = forfeit
- Quest rewards: fixed RC + XP per quest
- Breeding: 2 roosters → new rooster (cost: 200 RC + cooldown)
- Marketplace: player-to-player RC trades

## Stack
Supabase (PostgreSQL, Auth, Realtime) + Vercel Serverless Functions
