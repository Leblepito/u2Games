# R3F + Next.js SSR safety audit — 2026-04-19

CLAUDE.md "Critical Rules / R3F" requires:

> Canvas components MUST use `next/dynamic` with `ssr: false`.

Why: `@react-three/fiber`'s `Canvas` and the WebGL renderer it boots
are browser-only. SSR-rendering them throws `ReferenceError: window is
not defined` at request time and breaks the route.

## Audit results

| Check | Result | Notes |
|-------|--------|-------|
| `Canvas` imported in `src/app/**` directly | ❌ none | Only via `dynamic` |
| `Canvas` import sites | 1 — `src/components/canvas/GameCanvas.tsx` | Wrapped client-only component |
| Loader of GameCanvas | `src/app/play/page.tsx:12` | `dynamic(() => import("@/components/canvas/GameCanvas"), { ssr: false, loading: ... })` |
| `LobbyPanel` (R3F-free, but interactive) loader | `src/app/play/page.tsx:8` | `dynamic(..., { ssr: false })` — defensive, allowed |
| `useFrame` / `useGLTF` / drei imports | 5 files under `src/game/**` | Children of `<Canvas>`, never rendered SSR. OK. |

**Conclusion:** the codebase is compliant today.

## Regression guard

Added an ESLint `no-restricted-imports` rule scoped to `src/app/**` and
`src/pages/**` that errors on `import { Canvas } from "@react-three/fiber"`.
Future drift will fail `npm run lint`.

## What this rule does NOT cover

- A re-export via a barrel (e.g. `import { Canvas } from "@/lib/x"` where
  `x` re-exports `@react-three/fiber`'s `Canvas`). If we ever introduce
  such a barrel, extend the rule with the new path.
- `dynamic(() => import("@/components/canvas/Foo"))` *without* `ssr: false`
  — still produces SSR warnings. Reviewer-only check for now.

## Cross-references

- `src/components/canvas/GameCanvas.tsx` — sole `<Canvas>` site
- `src/app/play/page.tsx` — sole `dynamic(..., { ssr: false })` loader
- `eslint.config.mjs` — guard rule
