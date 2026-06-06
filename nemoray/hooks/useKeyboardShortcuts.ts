"use client";

import { useEffect } from "react";
import { useNemoStore } from "@/store";

/** Global HUD shortcuts: [ ] \ toggle rails/bar, F focuses the map, +/-/0 camera. */
export function useKeyboardShortcuts() {
  const togglePanel = useNemoStore((s) => s.togglePanel);
  const toggleMapFocus = useNemoStore((s) => s.toggleMapFocus);
  const requestCamera = useNemoStore((s) => s.requestCamera);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      switch (e.key) {
        case "[":
          e.preventDefault();
          togglePanel("left");
          break;
        case "]":
          e.preventDefault();
          togglePanel("right");
          break;
        case "\\":
          e.preventDefault();
          togglePanel("bottom");
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleMapFocus();
          break;
        case "+":
        case "=":
          e.preventDefault();
          requestCamera("zoomIn");
          break;
        case "-":
        case "_":
          e.preventDefault();
          requestCamera("zoomOut");
          break;
        case "0":
          e.preventDefault();
          requestCamera("reset");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePanel, toggleMapFocus, requestCamera]);
}
