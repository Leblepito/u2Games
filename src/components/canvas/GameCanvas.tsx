"use client";

import { Canvas } from "@react-three/fiber";
import { StatsGl } from "@react-three/drei";
import { Suspense } from "react";
import KanchanaburiVillage from "@/game/scenes/KanchanaburiVillage";

export default function GameCanvas(): React.JSX.Element {
  return (
    <div className="r3f-canvas-container">
      <Canvas
        shadows
        camera={{ position: [0, 8, 15], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <KanchanaburiVillage />
        </Suspense>

        {process.env.NODE_ENV === "development" && <StatsGl />}
      </Canvas>
    </div>
  );
}
