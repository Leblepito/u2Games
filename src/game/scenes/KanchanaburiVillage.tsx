"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF, Sky, Cloud } from "@react-three/drei";
import * as THREE from "three";
import PlayerRooster from "@/game/characters/PlayerRooster";
import NpcCharacter from "@/game/characters/NpcCharacter";
import { KANCHANABURI_NPCS } from "@/game/world/npcData";
import { useGameStore } from "@/lib/store";

useGLTF.preload("/models/buildings/coop-complex.glb");

/** Coop complex — Meshy.ai 3D model */
function CoopComplex(): React.JSX.Element {
  const { scene } = useGLTF("/models/buildings/coop-complex.glb");
  return (
    <primitive
      object={scene.clone()}
      position={[-6, 0, -3]}
      scale={1.5}
      rotation={[0, 0.5, 0]}
      castShadow
      receiveShadow
    />
  );
}

/** Grass ground with texture-like variation */
function Ground(): React.JSX.Element {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a5a28" roughness={0.9} />
      </mesh>
      {/* Dirt patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial color="#5a4a35" roughness={1} />
      </mesh>
      {/* Village path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[2.5, 35]} />
        <meshStandardMaterial color="#8B7355" roughness={0.85} />
      </mesh>
      {/* Path cross */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
        <planeGeometry args={[25, 2]} />
        <meshStandardMaterial color="#8B7355" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Palm-style tropical tree */
function PalmTree({ position }: { position: [number, number, number] }): React.JSX.Element {
  return (
    <group position={position}>
      {/* Trunk — slightly curved */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 3, 8]} />
        <meshStandardMaterial color="#6B4423" roughness={0.9} />
      </mesh>
      {/* Canopy — multiple spheres for fullness */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.2, 16, 12]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 3.5, 0.3]} castShadow>
        <sphereGeometry args={[0.7, 12, 8]} />
        <meshStandardMaterial color="#2d7a2d" roughness={0.8} />
      </mesh>
      <mesh position={[-0.3, 3.4, -0.2]} castShadow>
        <sphereGeometry args={[0.6, 12, 8]} />
        <meshStandardMaterial color="#236b23" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Bamboo fence sections */
function BambooFence({ start, end }: { start: [number, number, number]; end: [number, number, number] }): React.JSX.Element {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[2] + end[2]) / 2;

  return (
    <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
      {/* Horizontal rail */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, length]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, length]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Vertical posts */}
      {Array.from({ length: Math.ceil(length / 1.5) + 1 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.45, -length / 2 + i * 1.5]}
          castShadow
        >
          <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
          <meshStandardMaterial color="#7A6B55" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Third-person camera that follows the player */
function FollowCamera(): null {
  const { camera } = useThree();
  const offset = useRef(new THREE.Vector3(0, 6, 12));
  const lookTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    const pos = useGameStore.getState().playerPosition;
    const target = new THREE.Vector3(pos[0], pos[1], pos[2]);

    // Camera follows with smooth lerp
    const desiredPos = target.clone().add(offset.current);
    camera.position.lerp(desiredPos, 0.05);

    // Look at player
    lookTarget.current.lerp(target, 0.1);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

export default function KanchanaburiVillage(): React.JSX.Element {
  return (
    <>
      {/* Sky + atmosphere */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.52}
        azimuth={0.25}
        rayleigh={0.5}
      />
      <fog attach="fog" args={["#87CEEB", 30, 80]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#fff5e6" />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.5}
        color="#fff0d4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
      />
      {/* Fill light */}
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#b0d4ff" />

      {/* Ground */}
      <Ground />

      {/* Coop complex — Meshy 3D model */}
      <CoopComplex />

      {/* Trees — scattered around village */}
      <PalmTree position={[-3, 0, -10]} />
      <PalmTree position={[5, 0, -8]} />
      <PalmTree position={[-9, 0, 3]} />
      <PalmTree position={[10, 0, 5]} />
      <PalmTree position={[-2, 0, 12]} />
      <PalmTree position={[8, 0, -12]} />
      <PalmTree position={[-12, 0, -6]} />
      <PalmTree position={[4, 0, 14]} />
      <PalmTree position={[12, 0, -2]} />
      <PalmTree position={[-8, 0, 10]} />

      {/* Bamboo fences around arena area */}
      <BambooFence start={[-4, 0, 6]} end={[4, 0, 6]} />
      <BambooFence start={[4, 0, 6]} end={[4, 0, 10]} />
      <BambooFence start={[-4, 0, 6]} end={[-4, 0, 10]} />

      {/* Player */}
      <PlayerRooster />

      {/* Camera follow */}
      <FollowCamera />

      {/* NPCs */}
      {KANCHANABURI_NPCS.map((npc) => (
        <NpcCharacter key={npc.id} npc={npc} />
      ))}
    </>
  );
}
