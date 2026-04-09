"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, StatsGl } from "@react-three/drei";
import { Suspense } from "react";

/**
 * Main 3D Canvas — persistent, mounts once.
 * Scenes swap inside via game state.
 */
export default function GameCanvas() {
  return (
    <div className="r3f-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 3]} intensity={1} castShadow />
          <Environment preset="sunset" background={false} />

          {/* Phase 0: placeholder ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>

          <OrbitControls
            maxPolarAngle={Math.PI / 2.2}
            minDistance={3}
            maxDistance={20}
          />
        </Suspense>

        {process.env.NODE_ENV === "development" && <StatsGl />}
      </Canvas>
    </div>
  );
}
