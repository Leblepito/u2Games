# ADR 0001: Feature-Sliced Design Pilot for Lobby

## Status
Accepted

## Context
RoosterVerse currently keeps most gameplay state and UI wiring in shared app-level modules. This slows down vertical feature delivery because lobby UI, lobby state transitions, and lobby backend integration are not co-located. We need a low-risk pilot refactor that validates Feature-Sliced Design v2 boundaries before wider adoption.

## Decision
Adopt FSD v2 structure for one pilot feature: `src/features/lobby`.

Implemented slices:
- `ui/` for lobby screen components
- `model/` for lobby XState machine and Zustand slice
- `api/` for Supabase query functions
- `lib/` for pure validation helpers
- `index.ts` as the only public API surface

Application routing now enters gameplay through lobby phase first, then transitions to exploring phase when lobby actions complete.

## Consequences
### Positive
- Feature code is localized and easier to reason about.
- Public API boundary is explicit via `features/lobby/index.ts`.
- Lobby model evolution (matchmaking, room lifecycle) can proceed without touching unrelated game modules.

### Negative
- Temporary duplication risk while legacy global store and feature store coexist.
- Team needs discipline to avoid cross-feature imports.

## Follow-up
- Add `shared/` layer primitives for reusable validators and API clients.
- Migrate one more feature (`character-select`) to confirm repeatability.
- Add integration tests for lobby create/join flows with Supabase fixtures.
