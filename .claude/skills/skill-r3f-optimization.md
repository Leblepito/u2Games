---
name: skill-r3f-optimization
description: Use when building, modifying, or reviewing React Three Fiber (R3F) components, 3D scenes, or combat animations in u2Games (RoosterVerse).
---

# React Three Fiber Optimization Skill

## Overview
This skill is mandatory for any task involving `src/components/canvas/`, `src/game/scenes/`, or `src/game/combat/` in u2Games. It enforces strict performance targets required for 60fps rendering on mid-range mobile devices.

## Core Directives

### 1. Component Architecture (NON-NEGOTIABLE)
- **Use Client:** Every R3F component MUST start with the `"use client"` directive.
- **Dynamic Import:** Canvas components MUST be imported using `next/dynamic` with `{ ssr: false }`. The 3D canvas cannot be server-side rendered.
- **State Mutation:** NEVER call React `setState` inside the `useFrame` loop. Mutate `useRef` values directly or use `useGameStore.getState()` to read state without triggering re-renders.

### 2. Performance Targets
- **Draw Calls:** Keep draw calls under 100 per frame. Combine meshes or use `InstancedMesh` for repeated objects.
- **Lighting:** Maximum 3 active lights per scene. Bake shadows into textures whenever possible.
- **Assets:** GLB models MUST be processed with `gltfjsx --transform` and stay under 2MB. Textures must not exceed 1024x1024 (512x512 preferred for mobile).

### 3. File Ownership Boundaries
Respect the parallel agent architecture:
- If you are modifying the 3D scene, do NOT touch `src/app/` (Frontend Agent territory) unless updating the dynamic import.
- Combat logic lives in `src/game/combat/` (XState). Do not hardcode combat rules inside the 3D components; subscribe to the XState machine.

## Common Mistakes
- Triggering React re-renders on every frame by putting a standard state variable in `useFrame`.
- Loading uncompressed `.gltf` files instead of optimized `.glb` files.
- Adding multiple point lights that cause severe performance drops on mobile devices.
