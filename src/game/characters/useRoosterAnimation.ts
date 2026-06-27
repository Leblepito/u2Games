"use client";

import { useEffect, useRef } from "react";
import { useAnimations } from "@react-three/drei";
import * as THREE from "three";

type RoosterState = "idle" | "walk" | "interact";

const CROSSFADE_DURATION = 0.25; // saniye

/**
 * Rigged rooster GLB'deki animasyonları yönetir.
 * Blender'dan gelen clip adları: "Idle", "Walk", "Interact"
 *
 * Kullanım:
 *   const { group, setAnimation } = useRoosterAnimation(gltf.animations, gltf.scene);
 *   // ...
 *   setAnimation(isMoving ? "walk" : "idle");
 */
export function useRoosterAnimation(
  animations: THREE.AnimationClip[],
  _scene: THREE.Object3D  // ileride bone/material erişimi için API'de tutuldu
): {
  group: React.RefObject<THREE.Group | null>;
  setAnimation: (state: RoosterState) => void;
} {
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, group);
  const currentState = useRef<RoosterState>("idle");

  // İlk yüklenmede Idle başlat
  useEffect(() => {
    const idle = actions["Idle"];
    if (idle) {
      idle.reset().fadeIn(0.1).play();
    }
  }, [actions]);

  function setAnimation(newState: RoosterState): void {
    if (newState === currentState.current) return;

    const prevAction = actions[capitalize(currentState.current)];
    const nextAction = actions[capitalize(newState)];

    if (!nextAction) return;

    // Interact özel: bir kere oynar, sonra idle'a döner
    if (newState === "interact") {
      nextAction.reset();
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;

      if (prevAction) {
        nextAction.crossFadeFrom(prevAction, CROSSFADE_DURATION, true);
      }
      nextAction.play();

      // Interact bitince idle'a dön
      const onFinish = (): void => {
        mixer.removeEventListener("finished", onFinish);
        setAnimation("idle");
      };
      mixer.addEventListener("finished", onFinish);
    } else {
      // Idle ve Walk: loop
      nextAction.reset();
      nextAction.setLoop(THREE.LoopRepeat, Infinity);

      if (prevAction) {
        nextAction.crossFadeFrom(prevAction, CROSSFADE_DURATION, true);
      }
      nextAction.play();
    }

    currentState.current = newState;
  }

  return { group, setAnimation };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
