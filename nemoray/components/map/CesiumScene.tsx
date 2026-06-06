"use client";

import * as Cesium from "cesium";
import { useEffect, useRef } from "react";

import CesiumViewer from "@/components/cesium/CesiumViewer";
import CesiumPostProcess from "@/components/cesium/CesiumPostProcess";
import PhotorealisticTiles from "@/components/cesium/PhotorealisticTiles";
import { CesiumCameraController } from "@/lib/cesium/camera/CesiumCameraController";
import type { MapSurfaceProps } from "@/lib/types";

/**
 * CesiumJS 3D scene dropped into the Mission Control map seam. Implements
 * {@link MapSurfaceProps} so it slots behind `MapMount` where `MapPlaceholder`
 * used to sit, filling its parent cell so the HUD rails/timeline reflow around it.
 *
 * Renders the Google Photorealistic city. Owns one `CesiumCameraController`
 * built when the viewer is ready (no polling), runs the single animated intro
 * flight, and honours `cameraCommand` intents dispatched from HUD chrome.
 */
export function CesiumScene({ cameraCommand }: MapSurfaceProps) {
  const controllerRef = useRef<CesiumCameraController | null>(null);
  const lastNonce = useRef<number>(-1);

  const handleReady = (viewer: Cesium.Viewer) => {
    const controller = new CesiumCameraController(viewer);
    // Cinematic zoom-in from the globe → London. Engage the zoom limits only
    // once it settles, so they can't clamp the far starting view mid-flight.
    controller.flyInFromGlobe(() => controller.configureControls());
    controllerRef.current = controller;
  };

  // Honour one-shot camera intents (nonce-deduped so a remount can't re-fire).
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !cameraCommand) return;
    if (cameraCommand.nonce === lastNonce.current) return;
    lastNonce.current = cameraCommand.nonce;

    switch (cameraCommand.type) {
      case "zoomIn":
        controller.zoomByFactor("in");
        break;
      case "zoomOut":
        controller.zoomByFactor("out");
        break;
      case "reset":
        controller.resetView();
        break;
      case "tilt2d":
        controller.setTilt("2d");
        break;
      case "tilt3d":
        controller.setTilt("3d");
        break;
    }
  }, [cameraCommand]);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#030a18]">
      <CesiumViewer
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        onReady={handleReady}
      >
        <PhotorealisticTiles />
        <CesiumPostProcess />
      </CesiumViewer>
    </div>
  );
}

export default CesiumScene;
