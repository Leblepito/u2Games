"use client";

import { useEffect, useRef } from "react";

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
}

export function useKeyboard(): React.MutableRefObject<KeyState> {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  useEffect(() => {
    const map: Record<string, keyof KeyState> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "backward",
      ArrowDown: "backward",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      KeyE: "interact",
      Space: "interact",
    };

    function onKeyDown(e: KeyboardEvent): void {
      const action = map[e.code];
      if (action) keys.current[action] = true;
    }

    function onKeyUp(e: KeyboardEvent): void {
      const action = map[e.code];
      if (action) keys.current[action] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keys;
}
