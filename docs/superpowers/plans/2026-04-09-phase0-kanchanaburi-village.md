# Phase 0: Kanchanaburi Village Scene Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first playable 3D scene — Kanchanaburi village with a controllable rooster, third-person camera, and Pa Noi NPC with dialogue interaction.

**Architecture:** R3F scene component renders village ground + props. Player rooster uses WASD/arrow keys + touch for movement, with a third-person camera following. NPC detection via distance check triggers dialogue UI overlay. All game state flows through Zustand store.

**Tech Stack:** Next.js 15, React Three Fiber 9, @react-three/drei 10, Zustand 5, Three.js r170+, TypeScript strict

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/game/scenes/KanchanaburiVillage.tsx` | Create | Village 3D scene: ground, huts, trees, lighting |
| `src/game/characters/PlayerRooster.tsx` | Create | Player rooster: GLB model or placeholder, WASD movement, animation |
| `src/game/characters/NpcCharacter.tsx` | Create | Generic NPC: GLB/placeholder, idle animation, interaction radius |
| `src/game/world/npcData.ts` | Create | NPC definitions: Pa Noi dialogue lines, position, name |
| `src/components/ui/DialogueBox.tsx` | Create | Dialogue overlay UI: speaker name, text, next/close buttons |
| `src/components/ui/GameHUD.tsx` | Create | HUD: chapter title, RC count, minimap placeholder |
| `src/hooks/useKeyboard.ts` | Create | Keyboard input hook: WASD/arrows pressed state |
| `src/hooks/useNpcInteraction.ts` | Create | NPC proximity detection + dialogue trigger |
| `src/components/canvas/GameCanvas.tsx` | Modify | Mount KanchanaburiVillage scene, add camera rig |
| `src/app/play/page.tsx` | Modify | Add DialogueBox + GameHUD overlay |
| `src/lib/store.ts` | Modify | Add dialogue state, player position, npc interaction |

---

## Chunk 1: Core Infrastructure (Keyboard + Store + Types)

### Task 1: Keyboard Input Hook

**Files:**
- Create: `src/hooks/useKeyboard.ts`

- [ ] **Step 1: Create keyboard hook**

```typescript
// src/hooks/useKeyboard.ts
"use client";

import { useEffect, useRef } from "react";

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
}

export function useKeyboard(): React.MutableRefObject<KeyState> {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  useEffect(() => {
    const map: Record<string, keyof KeyState> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "backward",
      ArrowDown: "backward",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      KeyE: "interact",
      Space: "interact",
    };

    function onKeyDown(e: KeyboardEvent): void {
      const action = map[e.code];
      if (action) keys.current[action] = true;
    }

    function onKeyUp(e: KeyboardEvent): void {
      const action = map[e.code];
      if (action) keys.current[action] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keys;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useKeyboard.ts
git commit -m "feat(input): add WASD/arrow keyboard input hook"
```

---

### Task 2: Extend Zustand Store with Dialogue & Player State

**Files:**
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Add dialogue and player position state**

Add to the existing GameState interface and store:

```typescript
// Add to GameState interface:
  dialogueSpeaker: string;
  dialogueLines: string[];
  dialogueIndex: number;
  playerPosition: [number, number, number];

// Add actions:
  openDialogue: (speaker: string, lines: string[]) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
```

Implementation in store:

```typescript
dialogueSpeaker: "",
dialogueLines: [],
dialogueIndex: 0,
playerPosition: [0, 0.5, 5],

openDialogue: (speaker, lines) =>
  set({ phase: "dialogue", dialogueSpeaker: speaker, dialogueLines: lines, dialogueIndex: 0 }),

advanceDialogue: () => {
  const { dialogueIndex, dialogueLines } = get();
  if (dialogueIndex < dialogueLines.length - 1) {
    set({ dialogueIndex: dialogueIndex + 1 });
  } else {
    get().closeDialogue();
  }
},

closeDialogue: () =>
  set({ phase: "exploring", dialogueSpeaker: "", dialogueLines: [], dialogueIndex: 0 }),

setPlayerPosition: (pos) => set({ playerPosition: pos }),
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/store.ts
git commit -m "feat(store): add dialogue state and player position to game store"
```

---

### Task 3: NPC Data Definition

**Files:**
- Create: `src/game/world/npcData.ts`

- [ ] **Step 1: Create NPC data file**

```typescript
// src/game/world/npcData.ts

export interface NpcDef {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians
  interactionRadius: number;
  dialogueLines: string[];
  icon: string; // emoji for HUD
}

export const KANCHANABURI_NPCS: NpcDef[] = [
  {
    id: "pa_noi",
    name: "Pa Noi",
    position: [4, 0, 3],
    rotation: -Math.PI / 4,
    interactionRadius: 3,
    dialogueLines: [
      "Ah, you're awake. Your grandfather's egg... it stirred last night.",
      "Lung Sombat vanished three moons ago. But he left something for you.",
      "This egg holds the last of Arun's bloodline. Some say it's cursed.",
      "I say it's destiny. Come — let me teach you what I know.",
      "A patient rooster watches the hasty one. Remember that.",
    ],
    icon: "👴",
  },
];
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/game/world/npcData.ts
git commit -m "feat(world): add Pa Noi NPC data for Kanchanaburi village"
```

---

## Chunk 2: 3D Scene Components

### Task 4: Player Rooster Character

**Files:**
- Create: `src/game/characters/PlayerRooster.tsx`

- [ ] **Step 1: Create player rooster component**

```typescript
// src/game/characters/PlayerRooster.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/lib/store";

const MOVE_SPEED = 4;
const ROTATION_SPEED = 8;
const BOUNDS = 20; // half-extent of village ground

export default function PlayerRooster(): React.JSX.Element {
  const meshRef = useRef<THREE.Group>(null!);
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "exploring") return;

    const mesh = meshRef.current;
    const k = keys.current;

    // Movement direction
    const moveX = (k.left ? 1 : 0) - (k.right ? 1 : 0);
    const moveZ = (k.forward ? -1 : 0) - (k.backward ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      // Rotate toward movement direction
      const targetAngle = Math.atan2(moveX, moveZ);
      mesh.rotation.y = THREE.MathUtils.lerp(
        mesh.rotation.y,
        targetAngle,
        ROTATION_SPEED * delta
      );

      // Move forward
      mesh.position.x += moveX * MOVE_SPEED * delta;
      mesh.position.z += moveZ * MOVE_SPEED * delta;

      // Clamp to bounds
      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -BOUNDS, BOUNDS);
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -BOUNDS, BOUNDS);

      // Update store (for NPC proximity checks)
      useGameStore.getState().setPlayerPosition([
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
      ]);
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 5]}>
      {/* Placeholder rooster body — will be replaced by GLB */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0.1]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      {/* Comb */}
      <mesh position={[0, 1.1, 0.1]}>
        <boxGeometry args={[0.05, 0.15, 0.2]} />
        <meshStandardMaterial color="#ff3333" />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0.85, 0.25]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <meshStandardMaterial color="#DAA520" />
      </mesh>
      {/* Tail feathers */}
      <mesh position={[0, 0.6, -0.3]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.1]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/game/characters/PlayerRooster.tsx
git commit -m "feat(character): add player rooster with WASD movement + placeholder mesh"
```

---

### Task 5: NPC Character Component

**Files:**
- Create: `src/game/characters/NpcCharacter.tsx`

- [ ] **Step 1: Create NPC component**

```typescript
// src/game/characters/NpcCharacter.tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/lib/store";
import type { NpcDef } from "@/game/world/npcData";
import { useKeyboard } from "@/hooks/useKeyboard";

interface NpcCharacterProps {
  npc: NpcDef;
}

export default function NpcCharacter({ npc }: NpcCharacterProps): React.JSX.Element {
  const meshRef = useRef<THREE.Group>(null!);
  const keys = useKeyboard();
  const wasInRange = useRef(false);

  useFrame(() => {
    const state = useGameStore.getState();
    if (state.phase === "dialogue") return;

    const playerPos = state.playerPosition;
    const dx = playerPos[0] - npc.position[0];
    const dz = playerPos[2] - npc.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    const inRange = dist < npc.interactionRadius;

    // Show interaction prompt when entering range
    if (inRange && !wasInRange.current) {
      // TODO: Show "Press E to talk" prompt
    }

    // Trigger dialogue on interact key
    if (inRange && keys.current.interact && state.phase === "exploring") {
      state.openDialogue(npc.name, npc.dialogueLines);
      keys.current.interact = false; // consume
    }

    wasInRange.current = inRange;
  });

  return (
    <group ref={meshRef} position={npc.position} rotation={[0, npc.rotation, 0]}>
      {/* Placeholder NPC body — elderly villager */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#D2B48C" />
      </mesh>
      {/* Hat (Pa Noi's bamboo hat) */}
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.35, 0.15, 16]} />
        <meshStandardMaterial color="#C4A35A" />
      </mesh>
      {/* Interaction radius indicator (debug) */}
      {process.env.NODE_ENV === "development" && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[npc.interactionRadius - 0.05, npc.interactionRadius, 32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/game/characters/NpcCharacter.tsx
git commit -m "feat(npc): add NPC character with proximity interaction trigger"
```

---

### Task 6: Kanchanaburi Village Scene

**Files:**
- Create: `src/game/scenes/KanchanaburiVillage.tsx`

- [ ] **Step 1: Create village scene**

```typescript
// src/game/scenes/KanchanaburiVillage.tsx
"use client";

import { Environment } from "@react-three/drei";
import PlayerRooster from "@/game/characters/PlayerRooster";
import NpcCharacter from "@/game/characters/NpcCharacter";
import { KANCHANABURI_NPCS } from "@/game/world/npcData";

/** Simple tree: cylinder trunk + sphere canopy */
function Tree({ position }: { position: [number, number, number] }): React.JSX.Element {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 2, 8]} />
        <meshStandardMaterial color="#5C4033" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#2D5A27" />
      </mesh>
    </group>
  );
}

/** Simple hut: box base + pyramid roof */
function Hut({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }): React.JSX.Element {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 2.5]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.4, 1.26]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
    </group>
  );
}

export default function KanchanaburiVillage(): React.JSX.Element {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <Environment preset="sunset" background={false} />

      {/* Ground — rice paddy brown */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>

      {/* Village path — lighter dirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3, 30]} />
        <meshStandardMaterial color="#6B5B45" />
      </mesh>

      {/* Huts */}
      <Hut position={[-5, 0, -2]} rotation={0.3} />
      <Hut position={[-6, 0, 5]} rotation={-0.5} />
      <Hut position={[6, 0, 0]} rotation={Math.PI / 6} />
      <Hut position={[5, 0, 8]} rotation={-0.2} />

      {/* Trees */}
      <Tree position={[-3, 0, -8]} />
      <Tree position={[4, 0, -6]} />
      <Tree position={[-8, 0, 2]} />
      <Tree position={[9, 0, 4]} />
      <Tree position={[-2, 0, 10]} />
      <Tree position={[7, 0, -10]} />
      <Tree position={[-10, 0, -5]} />
      <Tree position={[3, 0, 12]} />

      {/* Player */}
      <PlayerRooster />

      {/* NPCs */}
      {KANCHANABURI_NPCS.map((npc) => (
        <NpcCharacter key={npc.id} npc={npc} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/KanchanaburiVillage.tsx
git commit -m "feat(scene): add Kanchanaburi village with huts, trees, path"
```

---

## Chunk 3: UI Overlay + Wiring

### Task 7: Dialogue Box UI Component

**Files:**
- Create: `src/components/ui/DialogueBox.tsx`

- [ ] **Step 1: Create dialogue box**

```typescript
// src/components/ui/DialogueBox.tsx
"use client";

import { useGameStore } from "@/lib/store";

export default function DialogueBox(): React.JSX.Element | null {
  const phase = useGameStore((s) => s.phase);
  const speaker = useGameStore((s) => s.dialogueSpeaker);
  const lines = useGameStore((s) => s.dialogueLines);
  const index = useGameStore((s) => s.dialogueIndex);
  const advance = useGameStore((s) => s.advanceDialogue);
  const close = useGameStore((s) => s.closeDialogue);

  if (phase !== "dialogue" || lines.length === 0) return null;

  const isLast = index >= lines.length - 1;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl z-50"
      onClick={advance}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "e") advance();
        if (e.key === "Escape") close();
      }}
      tabIndex={0}
      role="dialog"
      aria-label="NPC dialogue"
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Speaker name */}
        <div className="text-amber-400 font-bold text-sm mb-2 uppercase tracking-wider">
          {speaker}
        </div>

        {/* Dialogue text */}
        <p className="text-white text-lg leading-relaxed">
          {lines[index]}
        </p>

        {/* Controls hint */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-slate-500 text-xs">
            {index + 1} / {lines.length}
          </span>
          <span className="text-slate-500 text-xs">
            {isLast ? "Click to close" : "Click to continue"}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/DialogueBox.tsx
git commit -m "feat(ui): add dialogue box overlay with speaker name + pagination"
```

---

### Task 8: Game HUD Component

**Files:**
- Create: `src/components/ui/GameHUD.tsx`

- [ ] **Step 1: Create HUD**

```typescript
// src/components/ui/GameHUD.tsx
"use client";

import { useGameStore } from "@/lib/store";

export default function GameHUD(): React.JSX.Element | null {
  const phase = useGameStore((s) => s.phase);
  const chapter = useGameStore((s) => s.currentChapter);
  const coins = useGameStore((s) => s.roosterCoins);
  const level = useGameStore((s) => s.level);

  if (phase === "menu") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex justify-between items-start p-4">
        {/* Chapter + Level */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">
            Chapter {chapter}
          </div>
          <div className="text-white text-sm">
            Lv.{level} &middot; Kanchanaburi
          </div>
        </div>

        {/* Coins */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-amber-400">RC</span>
          <span className="text-white font-bold">{coins}</span>
        </div>
      </div>

      {/* Controls hint — bottom left */}
      {phase === "exploring" && (
        <div className="absolute bottom-20 left-4 bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-400">
          <div>WASD / Arrows — Move</div>
          <div>E / Space — Interact</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/GameHUD.tsx
git commit -m "feat(ui): add game HUD with chapter, level, coins display"
```

---

### Task 9: Wire Everything Together

**Files:**
- Modify: `src/components/canvas/GameCanvas.tsx`
- Modify: `src/app/play/page.tsx`
- Modify: `src/lib/store.ts` (set initial phase to "exploring")

- [ ] **Step 1: Update GameCanvas to mount village scene**

Replace entire GameCanvas content:

```typescript
// src/components/canvas/GameCanvas.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { StatsGl } from "@react-three/drei";
import { Suspense } from "react";
import KanchanaburiVillage from "@/game/scenes/KanchanaburiVillage";

export default function GameCanvas(): React.JSX.Element {
  return (
    <div className="r3f-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 8, 15], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <KanchanaburiVillage />
        </Suspense>

        {process.env.NODE_ENV === "development" && <StatsGl />}
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Update play/page.tsx to add UI overlay**

```typescript
// src/app/play/page.tsx
"use client";

import dynamic from "next/dynamic";
import DialogueBox from "@/components/ui/DialogueBox";
import GameHUD from "@/components/ui/GameHUD";

const GameCanvas = dynamic(() => import("@/components/canvas/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="text-slate-400 animate-pulse">Loading RoosterVerse...</p>
    </div>
  ),
});

export default function PlayPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950">
      <GameCanvas />
      <GameHUD />
      <DialogueBox />
    </div>
  );
}
```

- [ ] **Step 3: Update store initial phase**

In `src/lib/store.ts`, change:
```typescript
phase: "menu",
```
to:
```typescript
phase: "exploring",
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Verify build**

Run: `npx next build 2>&1 | tail -15`
Expected: All pages compile, no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/canvas/GameCanvas.tsx src/app/play/page.tsx src/lib/store.ts
git commit -m "feat(phase0): wire Kanchanaburi village scene + HUD + dialogue into play page"
```

---

### Task 10: Final Verification + Push

- [ ] **Step 1: Run dev server and visually verify**

Run: `npx next dev`
Open: http://localhost:3000/play

Verify:
- Village renders with brown ground, huts, trees
- Rooster placeholder visible
- WASD moves rooster
- Pa Noi NPC visible near position [4,0,3]
- Walking near Pa Noi + pressing E opens dialogue
- Dialogue box shows text, click advances, closes at end
- HUD shows Chapter 0, Lv.1, RC 0
- Controls hint visible at bottom left

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```
