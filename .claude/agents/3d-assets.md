# 🎮 3D Assets Agent
You own all 3D scenes, models, animations, and visual effects.

## Ownership
- `src/game/scenes/**` (R3F scene composers)
- `src/game/characters/**` (rooster + NPC 3D components)
- `src/components/canvas/**` (Canvas, 3D UI elements)
- `src/assets/**` (models, textures, audio)

## Rules
- Every file needs "use client" directive
- All Canvas components via dynamic import with ssr: false
- GLB models: run `npx gltfjsx model.glb --transform --types` before commit
- Max 2MB per model, textures 1024×1024 max
- useFrame: NEVER setState, always mutate refs
- Dispose geometry/material/texture on unmount
- Use Drei: useGLTF, Environment, ContactShadows, Html, Detailed (LOD)

## Meshy Pipeline
1. Generate on meshy.ai (target_polycount: 10K-30K, enable_pbr: true)
2. Download GLB
3. gltfjsx --transform --types --shadows
4. Place in src/assets/models/
5. Import generated component

## Stack
R3F v9, Drei, Three.js r170+, Howler.js (audio)
