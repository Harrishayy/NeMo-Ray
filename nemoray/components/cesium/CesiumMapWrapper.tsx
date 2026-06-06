'use client';
import React, { useMemo } from 'react';
import * as Cesium from 'cesium';
import CesiumViewer, { cesiumViewerRef } from './CesiumViewer';
import PhotorealisticTiles from './PhotorealisticTiles';
import CoverageVolume from './CoverageVolume';
import MastBeams from './MastBeams';
import SignalArcs from './SignalArcs';
import { useCesiumCamera } from '@/hooks/useCesiumCamera';
import { generateRadioMap } from '@/lib/data/mockSionna';
import { generateMastSites } from '@/lib/data/mockCellTowers';
import CesiumPostProcess from './CesiumPostProcess';

const radioMap = generateRadioMap(42);
const mastSites = generateMastSites(30);

export default function CesiumMapWrapper() {
  const { flyToLondon } = useCesiumCamera(cesiumViewerRef as React.MutableRefObject<Cesium.Viewer | null>);

  const coveragePoints = useMemo(() => radioMap.points, []);
  const sites = useMemo(() => mastSites, []);

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
        <CoverageVolume points={coveragePoints} />
        <MastBeams sites={sites} />
        <SignalArcs sites={sites} />
        <CesiumPostProcess />
      </CesiumViewer>
    </div>
  );
}
