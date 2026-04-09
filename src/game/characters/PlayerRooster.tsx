"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/lib/store";

const MOVE_SPEED = 4;
const ROTATION_SPEED = 8;
const BOUNDS = 20;

export default function PlayerRooster(): React.JSX.Element {
  const meshRef = useRef<THREE.Group>(null!);
  const keys = useKeyboard();

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "exploring") return;

    const mesh = meshRef.current;
    const k = keys.current;

    const moveX = (k.left ? 1 : 0) - (k.right ? 1 : 0);
    const moveZ = (k.forward ? -1 : 0) - (k.backward ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      const targetAngle = Math.atan2(moveX, moveZ);
      mesh.rotation.y = THREE.MathUtils.lerp(
        mesh.rotation.y,
        targetAngle,
        ROTATION_SPEED * delta
      );

      mesh.position.x += moveX * MOVE_SPEED * delta;
      mesh.position.z += moveZ * MOVE_SPEED * delta;

      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -BOUNDS, BOUNDS);
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -BOUNDS, BOUNDS);

      useGameStore.getState().setPlayerPosition([
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
      ]);
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 5]}>
      {/* Body */}
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
