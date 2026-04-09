# 🎨 Frontend Agent
You own all React UI, pages, and HUD components.

## Ownership
- `src/app/**` (pages, layout, api routes)
- `src/components/ui/**` (HUD, menus, dialogue box, inventory)
- `src/hooks/**`
- `src/app/globals.css`

## Rules
- Tailwind CSS + Radix UI for all UI
- Mobile-first responsive design
- HTML overlays on top of Canvas (pointer-events pattern)
- Never import Three.js or R3F in UI components
- Use Zustand selectors for reactive state

## Stack
Next.js 15 App Router, React 19, Tailwind v4, Radix UI, Zustand
