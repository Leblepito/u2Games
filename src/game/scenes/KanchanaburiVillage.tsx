"use client";

import { Environment } from "@react-three/drei";
import PlayerRooster from "@/game/characters/PlayerRooster";
import NpcCharacter from "@/game/characters/NpcCharacter";
import { KANCHANABURI_NPCS } from "@/game/world/npcData";

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

function Hut({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }): React.JSX.Element {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 2.5]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
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

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>

      {/* Village path */}
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

      <PlayerRooster />

      {KANCHANABURI_NPCS.map((npc) => (
        <NpcCharacter key={npc.id} npc={npc} />
      ))}
    </>
  );
}
