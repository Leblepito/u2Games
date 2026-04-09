"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useGameStore } from "@/lib/store";

const MOVE_SPEED = 5;
const ROTATION_SPEED = 10;
const BOUNDS = 22;

useGLTF.preload("/models/roosters/aseel.glb");

export default function PlayerRooster(): React.JSX.Element {
  const meshRef = useRef<THREE.Group>(null!);
  const keys = useKeyboard();
  const { scene } = useGLTF("/models/roosters/aseel.glb");

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "exploring") return;

    const mesh = meshRef.current;
    const k = keys.current;

    // W=forward(-Z), S=backward(+Z), A=left(-X), D=right(+X)
    const moveX = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    const moveZ = (k.backward ? 1 : 0) - (k.forward ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      const targetAngle = Math.atan2(-moveX, -moveZ);
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
      <primitive
        object={scene.clone()}
        scale={0.8}
        rotation={[0, Math.PI, 0]}
        castShadow
      />
    </group>
  );
}
