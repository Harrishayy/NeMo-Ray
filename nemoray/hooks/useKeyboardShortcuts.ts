"use client";

import { useEffect } from "react";
import { useNemoStore } from "@/store";

/** Global HUD shortcuts: [ ] \ toggle rails/bar, F focuses the map. */
export function useKeyboardShortcuts() {
  const togglePanel = useNemoStore((s) => s.togglePanel);
  const toggleMapFocus = useNemoStore((s) => s.toggleMapFocus);

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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePanel, toggleMapFocus]);
}
