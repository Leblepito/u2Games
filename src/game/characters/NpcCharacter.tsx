"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/lib/store";
import type { NpcDef } from "@/game/world/npcData";
import { useKeyboard } from "@/hooks/useKeyboard";

interface NpcCharacterProps {
  npc: NpcDef;
}

export default function NpcCharacter({ npc }: NpcCharacterProps): React.JSX.Element {
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

    if (inRange && keys.current.interact && state.phase === "exploring") {
      state.openDialogue(npc.name, npc.dialogueLines);
      keys.current.interact = false;
    }

    wasInRange.current = inRange;
  });

  return (
    <group position={npc.position} rotation={[0, npc.rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#D2B48C" />
      </mesh>
      {/* Bamboo hat */}
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.35, 0.15, 16]} />
        <meshStandardMaterial color="#C4A35A" />
      </mesh>
      {/* Interaction radius (debug) */}
      {process.env.NODE_ENV === "development" && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[npc.interactionRadius - 0.05, npc.interactionRadius, 32]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}
