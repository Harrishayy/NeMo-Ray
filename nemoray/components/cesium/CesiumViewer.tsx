'use client';

if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import React, { useEffect, useRef } from 'react';
import { applyNightScene } from '@/lib/cesium/sceneEffects';
import { INITIAL_CAMERA } from '@/lib/cesium/viewerConfig';

Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? '';

export const cesiumViewerRef: { current: Cesium.Viewer | null } = { current: null };

interface CesiumViewerProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (viewer: Cesium.Viewer) => void;
}

export default function CesiumViewer({ children, className, style, onReady }: CesiumViewerProps) {
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      globe: false,
      orderIndependentTranslucency: false,
    });

    applyNightScene(viewer);
    viewer.camera.flyTo(INITIAL_CAMERA);

    cesiumViewerRef.current = viewer;
    onReady?.(viewer);

    return () => {
      viewer.destroy();
      cesiumViewerRef.current = null;
      didInit.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="cesiumContainer"
      className={className}
      style={{ width: '100%', height: '100%', background: '#030a18', position: 'relative', ...style }}
    >
      {children}
    </div>
  );
}
