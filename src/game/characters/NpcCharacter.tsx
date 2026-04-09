"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import { useGameStore } from "@/lib/store";
import type { NpcDef } from "@/game/world/npcData";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useRoosterAnimation } from "./useRoosterAnimation";

useGLTF.preload("/models/roosters/shamo-rigged.glb");

interface NpcCharacterProps {
  npc: NpcDef;
}

export default function NpcCharacter({ npc }: NpcCharacterProps): React.JSX.Element {
  const keys = useKeyboard();
  const wasInRange = useRef(false);
  const gltf = useGLTF("/models/roosters/shamo-rigged.glb");
  const { group: animGroup, setAnimation } = useRoosterAnimation(gltf.animations, gltf.scene);

  useFrame(() => {
    const state = useGameStore.getState();
    if (state.phase === "dialogue") return;

    const playerPos = state.playerPosition;
    const dx = playerPos[0] - npc.position[0];
    const dz = playerPos[2] - npc.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    const inRange = dist < npc.interactionRadius;

    if (inRange && keys.current.interact && state.phase === "exploring") {
      setAnimation("interact");
      state.openDialogue(npc.name, npc.dialogueLines);
      keys.current.interact = false;
    }

    wasInRange.current = inRange;
  });

  return (
    <group position={npc.position} rotation={[0, npc.rotation, 0]}>
      <group ref={animGroup}>
        <primitive
          object={gltf.scene}
          scale={0.7}
          castShadow
        />
      </group>

      <Html
        position={[0, 2.2, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none" }}
      >
        <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1 text-center whitespace-nowrap">
          <span className="text-amber-400 text-xs font-bold">{npc.icon} {npc.name}</span>
          <div className="text-slate-400 text-[10px]">Press E to talk</div>
        </div>
      </Html>
    </group>
  );
}
