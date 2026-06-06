"use client";

import * as Cesium from "cesium";
import React, { useMemo } from "react";

import CesiumViewer, { cesiumViewerRef } from "@/components/cesium/CesiumViewer";
import CesiumPostProcess from "@/components/cesium/CesiumPostProcess";
import CoverageVolume from "@/components/cesium/CoverageVolume";
import MastBeams from "@/components/cesium/MastBeams";
import PhotorealisticTiles from "@/components/cesium/PhotorealisticTiles";
import SignalArcs from "@/components/cesium/SignalArcs";
import { useCesiumCamera } from "@/hooks/useCesiumCamera";
import { generateMastSites } from "@/lib/data/mockCellTowers";
import { generateRadioMap } from "@/lib/data/mockSionna";
import type { MapSurfaceProps } from "@/lib/types";

const radioMap = generateRadioMap(42);
const mastSites = generateMastSites(30);

/**
 * Thomas Moody's CesiumJS 3D scene, adapted to drop into the Mission Control
 * map seam. Implements {@link MapSurfaceProps} so it slots behind `MapMount`
 * exactly where `MapPlaceholder` used to sit. Unlike the standalone
 * `CesiumMapWrapper` (which fills `100vh`), this fills its parent cell so the
 * HUD rails/timeline reflow around it.
 *
 * The store-driven props are accepted for forward-compatibility; the scene
 * currently renders its own seeded mock dataset (matching Thomas's branch).
 */
export function CesiumScene(_props: MapSurfaceProps) {
  const { flyToLondon } = useCesiumCamera(
    cesiumViewerRef as React.MutableRefObject<Cesium.Viewer | null>,
  );

  const coveragePoints = useMemo(() => radioMap.points, []);
  const sites = useMemo(() => mastSites, []);

  const handleReady = () => {
    flyToLondon();
  };

  return (
    <div className="absolute inset-0 h-full w-full bg-[#030a18]">
      <CesiumViewer
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        onReady={handleReady}
      >
        <PhotorealisticTiles />
        <CoverageVolume points={coveragePoints} />
        <MastBeams sites={sites} />
        <SignalArcs sites={sites} />
        <CesiumPostProcess />
      </CesiumViewer>
    </div>
  );
}

export default CesiumScene;
