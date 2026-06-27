# Feature-Sliced Design (FSD) for u2games

Status: **seed only** — empty layer directories + ESLint boundary rule
+ this doc. The full migration (moving existing code from
`src/components/` and `src/game/` into FSD slices) is tracked
separately as `u2games-fsd-migration`.

## Why

`src/components/` and `src/game/` mix combat data, UI primitives, story
chrome, and 3D scene wiring at the same depth, so:
- "where does X go?" has no consistent answer for new code
- circular imports are hard to detect (UI imports combat; combat util
  imports a UI primitive; ...)
- agent-task ownership in CLAUDE.md "File Ownership" maps awkwardly
  onto a flat tree.

FSD gives us a **5-layer dependency cone** — each layer can only import
*downward* from layers below it, never sideways or upward.

## Layers (top → bottom)

| Layer | What | u2games examples (after migration) |
|-------|------|------------------------------------|
| `app/`        | Next.js App Router routes, root layout, providers | already exists |
| `processes/`  | Multi-page flows (rare; skip until needed)        | — |
| `pages/`      | Route-level composition components                | (folded into `app/` for now) |
| `widgets/`    | Standalone screen blocks built from features      | `<GameHUD>`, `<DialogueBox>` |
| `features/`   | User-facing capabilities                          | `lobby/`, `combat/`, `inventory/` |
| `entities/`   | Business model + read/write surface for one thing | `rooster/`, `player/`, `quest/` |
| `shared/`     | Stack-agnostic utils + design tokens + UI kit     | `ui/Button`, `lib/cn`, `assets/` |

## Import direction (enforced by ESLint)

```
app  ─→ widgets ─→ features ─→ entities ─→ shared
```

`shared/` may not import from any layer above it.
`entities/` may import only `shared/`.
`features/` may import `entities/` and `shared/`.
`widgets/` may import `features/`, `entities/`, `shared/`.
`app/` may import any layer.

## Slice anatomy

A slice is a top-level directory inside a layer (e.g. `features/lobby/`).
Within a slice we use FSD's standard segments:

```
features/lobby/
├── api/         # external IO (fetch, supabase, etc.)
├── model/       # state (zustand stores, hooks, types)
├── ui/          # React components rendered by this feature
├── lib/         # slice-local pure utilities
└── index.ts     # barrel — only public exports
```

The barrel is the **public API** of the slice; cross-slice imports
must go through it (`import { LobbyPanel } from "@/features/lobby"`),
not through internals (`@/features/lobby/ui/Panel.tsx`).

## What's seeded today

- `src/entities/`, `src/widgets/`, `src/shared/` exist (with `.gitkeep`)
  so future PRs land in the right place from day one.
- `src/features/lobby/` already follows the slice anatomy — kept as the
  reference shape for the migration.
- `src/components/` and `src/game/` stay until the migration task moves
  things piece by piece.
- ESLint `no-restricted-imports` rule (configured in `eslint.config.mjs`)
  prevents new violations of the cone:
    - `shared/**` may not import from `entities/` `features/` `widgets/`
    - `entities/**` may not import from `features/` `widgets/`
    - `features/**` may not import from `widgets/`
  (Imports from `app/` into lower layers are fine — `app` is the top.)

## Migration order (when scheduled)

1. `shared/` first: cn(), tailwind tokens, primitive UI (`Button`, `DialogueBox`).
2. `entities/rooster`, `entities/player`, `entities/quest`.
3. `features/combat`, `features/inventory`, `features/story`.
4. `widgets/GameHUD`, `widgets/DialogueOverlay`, `widgets/SceneCanvas`.
5. Adjust `src/app/play/page.tsx` to compose widgets only.
6. Delete the now-empty `src/components/` and `src/game/`.

Migration MUST NOT mix moves with logic changes — pure relocation
commits, then behavior changes in follow-ups.
