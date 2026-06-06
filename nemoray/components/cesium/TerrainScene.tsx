'use client';

import * as Cesium from 'cesium';
import { useEffect } from 'react';
import { cesiumViewerRef } from './CesiumViewer';

export default function TerrainScene({ enabled = false }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const viewer = cesiumViewerRef.current;
    if (!viewer) return;

    Cesium.CesiumTerrainProvider.fromIonAssetId(1).then((tp) => {
      viewer.terrainProvider = tp;
      viewer.scene.globe.show = true;
    });
  }, [enabled]);

  return null;
}
