'use client';
import React from 'react';
import * as Cesium from 'cesium';
import CesiumViewer, { cesiumViewerRef } from './CesiumViewer';
import PhotorealisticTiles from './PhotorealisticTiles';
import { useCesiumCamera } from '@/hooks/useCesiumCamera';
import CesiumPostProcess from './CesiumPostProcess';

/**
 * Standalone full-viewport Cesium scene for the /map route. Mirrors
 * `components/map/CesiumScene` — currently the photorealistic city only.
 * Mast markers, the coverage heatmap and signal arcs were removed; re-mount
 * `MastBeams` / `CoverageVolume` / `SignalArcs` here to bring them back.
 */
export default function CesiumMapWrapper() {
  const { flyToLondon } = useCesiumCamera(cesiumViewerRef as React.MutableRefObject<Cesium.Viewer | null>);

  const handleReady = (_viewer: Cesium.Viewer) => {
    flyToLondon();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#030a18' }}>
      <CesiumViewer
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        onReady={handleReady}
      >
        <PhotorealisticTiles />
        <CesiumPostProcess />
      </CesiumViewer>
    </div>
  );
}
