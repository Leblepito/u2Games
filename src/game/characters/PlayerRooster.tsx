"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/lib/store";
import { useRoosterAnimation } from "./useRoosterAnimation";

const MOVE_SPEED = 5;
const ROTATION_SPEED = 10;
const BOUNDS = 22;

useGLTF.preload("/models/roosters/aseel-rigged.glb");

export default function PlayerRooster(): React.JSX.Element {
  const posRef = useRef<THREE.Group>(null!);
  const keys = useKeyboard();
  const gltf = useGLTF("/models/roosters/aseel-rigged.glb");
  const { group: animGroup, setAnimation } = useRoosterAnimation(gltf.animations, gltf.scene);
  const wasMoving = useRef(false);

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "exploring") return;

    const pos = posRef.current;
    const k = keys.current;

    const moveX = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    const moveZ = (k.backward ? 1 : 0) - (k.forward ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;

    // Animasyon state değiştir
    if (isMoving && !wasMoving.current) {
      setAnimation("walk");
    } else if (!isMoving && wasMoving.current) {
      setAnimation("idle");
    }
    wasMoving.current = isMoving;

    if (isMoving) {
      const targetAngle = Math.atan2(-moveX, -moveZ);
      pos.rotation.y = THREE.MathUtils.lerp(
        pos.rotation.y,
        targetAngle,
        ROTATION_SPEED * delta
      );

      pos.position.x += moveX * MOVE_SPEED * delta;
      pos.position.z += moveZ * MOVE_SPEED * delta;

      pos.position.x = THREE.MathUtils.clamp(pos.position.x, -BOUNDS, BOUNDS);
      pos.position.z = THREE.MathUtils.clamp(pos.position.z, -BOUNDS, BOUNDS);

      useGameStore.getState().setPlayerPosition([
        pos.position.x,
        pos.position.y,
        pos.position.z,
      ]);
    }
  });

  return (
    <group ref={posRef} position={[0, 0, 5]}>
      <group ref={animGroup}>
        <primitive
          object={gltf.scene}
          scale={0.8}
          rotation={[0, Math.PI, 0]}
          castShadow
        />
      </group>
    </group>
  );
}
