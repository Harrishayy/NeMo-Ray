"use client";

import { useState } from "react";
import { Box, Locate, Minus, Plus, Square } from "lucide-react";

import { cn } from "@/lib/cn";
import type { CameraCommandType } from "@/lib/types";

/**
 * On-map camera control cluster (bottom-right). Dispatches one-shot camera
 * intents through the store's command bus — it never touches the Cesium viewer
 * directly, so it stays surface-agnostic. Rendered by `MapMount` so it's always
 * present over the map in `cesium` mode.
 */
export function MapCameraControls({
  onCommand,
}: {
  onCommand: (type: CameraCommandType) => void;
}) {
  // Local UI state for the tilt toggle's label/icon; the camera is the source of
  // truth for the actual pitch, this just tracks which view we last requested.
  const [is3d, setIs3d] = useState(true);

  const toggleTilt = () => {
    const next = !is3d;
    setIs3d(next);
    onCommand(next ? "tilt3d" : "tilt2d");
  };

  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex flex-col gap-px border border-hairline bg-panel/85 backdrop-blur-sm">
      <CtrlButton label="Zoom in" onClick={() => onCommand("zoomIn")}>
        <Plus size={15} strokeWidth={1.75} />
      </CtrlButton>
      <CtrlButton label="Zoom out" onClick={() => onCommand("zoomOut")}>
        <Minus size={15} strokeWidth={1.75} />
      </CtrlButton>
      <CtrlButton
        label={is3d ? "Switch to 2D (top-down)" : "Switch to 3D (oblique)"}
        onClick={toggleTilt}
      >
        {is3d ? <Square size={14} strokeWidth={1.75} /> : <Box size={14} strokeWidth={1.75} />}
      </CtrlButton>
      <CtrlButton label="Reset view" onClick={() => onCommand("reset")}>
        <Locate size={14} strokeWidth={1.75} />
      </CtrlButton>
    </div>
  );
}

/** A square HUD icon button, hairline-divided from its neighbours. */
function CtrlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center text-ink-dim transition-colors",
        "border-b border-hairline last:border-b-0",
        "hover:bg-nv/10 hover:text-nv",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nv",
      )}
    >
      {children}
    </button>
  );
}
