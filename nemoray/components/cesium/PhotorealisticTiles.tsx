'use client';

import * as Cesium from 'cesium';
import { useEffect } from 'react';
import { cesiumViewerRef } from './CesiumViewer';

export default function PhotorealisticTiles() {
  useEffect(() => {
    const viewer = cesiumViewerRef.current;
    if (!viewer) return;

    let tileset: Cesium.Cesium3DTileset | null = null;
    let cancelled = false;

    (async () => {
      tileset = await Cesium.createGooglePhotorealistic3DTileset({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      });
      if (!cancelled) {
        viewer.scene.primitives.add(tileset);
      }
    })();

    return () => {
      cancelled = true;
      if (tileset) {
        viewer.scene.primitives.remove(tileset);
      }
    };
  }, []);

  return null;
}
