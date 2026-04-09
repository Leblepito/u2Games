"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Sky, Text } from "@react-three/drei";
import * as THREE from "three";
import PlayerRooster from "@/game/characters/PlayerRooster";
import NpcCharacter from "@/game/characters/NpcCharacter";
import { KANCHANABURI_NPCS } from "@/game/world/npcData";
import { useGameStore } from "@/lib/store";

useGLTF.preload("/models/buildings/coop-complex.glb");

/** Coop complex — Meshy.ai 3D model */
function CoopComplex(): React.JSX.Element {
  const { scene } = useGLTF("/models/buildings/coop-complex.glb");

  // Enable shadows on all meshes in the model
  const cloned = scene.clone();
  cloned.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <primitive
      object={cloned}
      position={[-8, 0, -5]}
      scale={2}
      rotation={[0, 0.4, 0]}
    />
  );
}

/** Textured ground plane — grass with visible dirt */
function Ground(): React.JSX.Element {
  return (
    <group>
      {/* Base grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#4a7a3a" roughness={0.95} />
      </mesh>

      {/* Central village clearing — packed earth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      {/* Inner ring — darker trodden earth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#6B5B45" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Simple rock cluster for natural environment feel */
function RockCluster({ position, scale = 1 }: { position: [number, number, number]; scale?: number }): React.JSX.Element {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#7a7a72" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.3, 0.1, 0.15]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#6a6a62" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.15, 0.08, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#8a8a82" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

/** Third-person camera that follows the player */
function FollowCamera(): null {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 6, 12));
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const pos = useGameStore.getState().playerPosition;
    const target = new THREE.Vector3(pos[0], pos[1], pos[2]);

    const desiredPos = new THREE.Vector3(
      target.x,
      target.y + 5,
      target.z + 10
    );

    smoothPos.current.lerp(desiredPos, 0.04);
    camera.position.copy(smoothPos.current);

    lookTarget.current.lerp(target, 0.08);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

export default function KanchanaburiVillage(): React.JSX.Element {
  return (
    <>
      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 30, 100]}
        inclination={0.52}
        azimuth={0.25}
        rayleigh={0.4}
      />
      <fog attach="fog" args={["#c8dce8", 40, 100]} />

      {/* Lighting — warm tropical afternoon */}
      <ambientLight intensity={0.6} color="#fff5e6" />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.8}
        color="#fff0d4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} color="#b0d4ff" />
      <hemisphereLight color="#87CEEB" groundColor="#4a7a3a" intensity={0.4} />

      {/* Ground */}
      <Ground />

      {/* Coop complex — Meshy 3D (main building) */}
      <CoopComplex />

      {/* Natural rocks scattered around */}
      <RockCluster position={[-3, 0, -8]} scale={1.5} />
      <RockCluster position={[6, 0, -6]} scale={1.0} />
      <RockCluster position={[-10, 0, 3]} scale={2.0} />
      <RockCluster position={[9, 0, 6]} scale={1.2} />
      <RockCluster position={[4, 0, 12]} scale={0.8} />
      <RockCluster position={[-5, 0, 10]} scale={1.4} />

      {/* Location marker */}
      <Text
        position={[0, 0.05, -10]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.5}
        color="#5a4a35"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        KANCHANABURI
      </Text>

      {/* Player */}
      <PlayerRooster />

      {/* Camera */}
      <FollowCamera />

      {/* NPCs */}
      {KANCHANABURI_NPCS.map((npc) => (
        <NpcCharacter key={npc.id} npc={npc} />
      ))}
    </>
  );
}
