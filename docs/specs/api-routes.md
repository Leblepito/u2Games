# 🌐 API Routes Specification

All backend runs as Next.js Serverless Functions on Vercel.
No Railway. No FastAPI.

## Auth
Handled by `@supabase/supabase-js` client-side + Supabase Auth.

## Supabase Clients
- **Server routes:** `import { createClient } from '@/lib/supabase/server'` (service role — bypasses RLS)
- **React components:** `import { createClient } from '@/lib/supabase/client'` (anon key — respects RLS)

## Routes

### Roosters
```
GET    /api/roosters           → List user's roosters (?user_id=)
POST   /api/roosters           → Create rooster
PATCH  /api/roosters/[id]      → Update rooster
DELETE /api/roosters/[id]      → Delete rooster
```

### Battles
```
GET    /api/battles            → Battle history (?player_id=)
POST   /api/battles            → Submit battle result (server validates + computes)
```

### Economy
```
GET    /api/wallet             → Get RC balance (?user_id=)
POST   /api/breeding           → Breed two roosters (costs 200 RC)
```

### Marketplace
```
GET    /api/marketplace        → List all listed items
POST   /api/marketplace        → List item for sale
DELETE /api/marketplace/[id]   → Cancel listing
```

### Story
```
GET    /api/story              → Get story progress (?user_id=)
POST   /api/story              → Complete chapter (upserts progress)
```

### Leaderboard
```
GET    /api/leaderboard        → Top 100 players (?sort=rooster_coins|xp|level)
```

## Supabase RPC Functions Required
```sql
-- increment_coins: atomic RC update
CREATE OR REPLACE FUNCTION increment_coins(user_id UUID, amount INT)
RETURNS void AS $$
  UPDATE rv_users SET rooster_coins = rooster_coins + amount WHERE id = user_id;
$$ LANGUAGE sql;
```
