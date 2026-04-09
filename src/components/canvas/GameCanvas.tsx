"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import KanchanaburiVillage from "@/game/scenes/KanchanaburiVillage";

export default function GameCanvas(): React.JSX.Element {
  return (
    <div className="r3f-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 6, 12], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, toneMapping: 4 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <KanchanaburiVillage />
        </Suspense>
      </Canvas>
    </div>
  );
}
