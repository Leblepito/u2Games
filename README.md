# 🐓 u2Games — RoosterVerse

> 3D turn-based RPG browser game. Raise fighting roosters, battle across Southeast Asia, earn coins through arena victories and quests.

**Tech:** Next.js 15 · React Three Fiber 9 · Three.js · Zustand · XState · Tailwind CSS · Radix UI · Howler.js  
**Backend:** FastAPI (Railway) · PostgreSQL (Supabase) · Meshy.ai (3D assets)  
**Deploy:** Vercel (frontend) · Railway (backend)

---

## Story

**Season 1 — "The Crow of Freedom"** (Naruto-inspired)  
Orphaned rooster breeder discovers their grandfather's legendary bird carries the spirit of King Naresuan. Journey across Thailand, Bali, Philippines, and Vietnam battling the Syndicate criminal organization. 13 chapters, 5 mentors, rival-turned-friend Kai.

**Season 2 — "Paradise of Ashes"** (Hell's Paradise-inspired)  
A mysterious island appears in the Andaman Sea. Death-row breeders are sent to retrieve the Golden Tao elixir. Player is paired with Ren "Ash" — a hollow, emotionless fighter whose only bond is his small white rooster Yuki. Paradise hides hell. 10 chapters, partner combat system, Lom energy mechanics.

Full story bibles: `docs/gdd/`

---

## Architecture

```
u2Games/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── layout.tsx          # Root — persistent R3F Canvas
│   │   ├── page.tsx            # Landing — 3D hero scene
│   │   ├── play/page.tsx       # Game entry
│   │   └── api/                # Proxy routes → Railway backend
│   ├── game/
│   │   ├── scenes/             # R3F scene composers (Village, Arena, Island...)
│   │   ├── characters/         # Rooster + NPC 3D models, animation
│   │   ├── combat/             # Turn-based battle (XState flow + Zustand data)
│   │   ├── story/              # Chapter system, dialogue engine, cutscenes
│   │   ├── world/              # Zone management, NPC spawn, world state
│   │   └── systems/            # XP, inventory, quest tracker, economy, save/load
│   ├── components/
│   │   ├── canvas/             # R3F components ("use client" + dynamic import)
│   │   └── ui/                 # HUD, dialogue box, menus (HTML overlay)
│   ├── hooks/                  # useGameState, useRooster, useCombat, useLom
│   ├── lib/                    # Constants, types, utils
│   └── assets/
│       ├── models/             # Meshy.ai GLB files (Draco compressed)
│       ├── textures/           # Environment textures
│       └── audio/              # SFX + ambient (Howler.js)
├── docs/
│   ├── gdd/                    # Game Design Documents + Story Bibles
│   └── specs/                  # Technical specs
├── database/                   # SQL migrations
├── CLAUDE.md                   # AI agent instructions
└── .claude/agents/             # Specialized agent prompts
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/Leblepito/u2Games.git
cd u2Games

# Install
npm install

# Environment
cp .env.example .env.local
# Fill in Supabase, Railway, Meshy API keys

# Dev
npm run dev          # http://localhost:3000

# Build
npm run build
npm run start
```

---

## Agent Development

This project uses parallel Claude Code agents. See `CLAUDE.md` for instructions and `.claude/agents/` for specialized agent prompts.

```bash
# Create worktrees for parallel agents
git worktree add ../rv-frontend -b agent/frontend main
git worktree add ../rv-backend -b agent/backend main
git worktree add ../rv-combat -b agent/combat main
git worktree add ../rv-story -b agent/story main
git worktree add ../rv-3d -b agent/3d-assets main
```

---

## Deploy

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `u2games.vercel.app` |
| Backend API | Railway | `api.u2games.app` |
| Database | Supabase | managed |
| 3D Assets | Meshy.ai → CDN | `/public/models/` |

---

## Economy System

Players earn **RoosterCoin (RC)** through:
- Arena victories (bet & win)
- Quest completion rewards
- Breeding & selling roosters
- Item trading in marketplace

No real-money trading integration. Pure in-game economy.

---

## License

MIT — see [LICENSE](./LICENSE)
