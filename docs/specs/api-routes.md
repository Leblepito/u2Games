# 🌐 API Routes Specification

## Frontend Proxy (Vercel → Railway)
`/api/game/*` rewrites to Railway backend.

## Auth (Supabase Direct)
Handled by @supabase/supabase-js client-side.

## Game API (Railway FastAPI)

### Roosters
```
GET    /api/roosters           → List user's roosters
POST   /api/roosters           → Create rooster
PATCH  /api/roosters/:id       → Update rooster
DELETE /api/roosters/:id       → Delete rooster
```

### Battles
```
POST   /api/battles/start      → Validate & start battle
POST   /api/battles/result     → Submit result + server validation
GET    /api/battles/history     → Battle history
```

### Economy
```
GET    /api/wallet              → Get RC balance
POST   /api/wallet/bet          → Place arena bet
POST   /api/wallet/claim        → Claim winnings
POST   /api/breeding/start      → Start breeding (spend RC)
```

### Marketplace
```
GET    /api/marketplace         → List all items
POST   /api/marketplace/list    → List item for sale
POST   /api/marketplace/buy     → Buy item
DELETE /api/marketplace/:id     → Cancel listing
```

### Story
```
GET    /api/story/progress      → Get story progress
POST   /api/story/complete      → Complete chapter (server validates)
```

### Leaderboard
```
GET    /api/leaderboard         → Top players by wins/RC/level
```
