'use client';

if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import React, { useEffect, useRef, useState } from 'react';
import { applyNightScene } from '@/lib/cesium/sceneEffects';
import { GLOBE_CAMERA } from '@/lib/cesium/viewerConfig';
import { CesiumContext } from './CesiumContext';

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
  const [webglError, setWebglError] = useState<string | null>(null);
  const [readyViewer, setReadyViewer] = useState<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const sharedOptions = {
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
    } as const;

    let viewer: Cesium.Viewer | null = null;
    let initError: unknown = null;

    // Try WebGL2 first, then fall back to WebGL1 (better Linux/driver compatibility).
    for (const requestWebgl1 of [false, true]) {
      try {
        viewer = new Cesium.Viewer('cesiumContainer', {
          ...sharedOptions,
          contextOptions: {
            requestWebgl1,
            webgl: { failIfMajorPerformanceCaveat: false },
          },
        });
        initError = null;
        break;
      } catch (err) {
        initError = err;
        // Clean up any partial state before the next attempt.
        const el = document.getElementById('cesiumContainer');
        if (el) el.innerHTML = '';
      }
    }

    if (initError || !viewer) {
      const msg = initError instanceof Error ? initError.message : String(initError);
      console.error('Cesium init failed (WebGL2 + WebGL1):', initError);
      setWebglError(msg);
      didInit.current = false;
    } else {
      applyNightScene(viewer);
      // Start instantly on the far globe view; the surface owns the single
      // animated fly-in down to London (CesiumScene → controller.flyInFromGlobe),
      // so the cinematic plays without two flights racing.
      viewer.camera.setView(GLOBE_CAMERA);
      cesiumViewerRef.current = viewer;
      setReadyViewer(viewer);
      onReady?.(viewer);
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      cesiumViewerRef.current = null;
      setReadyViewer(null);
      didInit.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (webglError) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          background: '#030a18',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontFamily: 'monospace',
          gap: '12px',
          ...style,
        }}
      >
        <div style={{ fontSize: '2rem' }}>⚠</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>WebGL unavailable</div>
        <div style={{ fontSize: '0.75rem', maxWidth: 400, textAlign: 'center', opacity: 0.6 }}>
          {webglError}
        </div>
      </div>
    );
  }

  return (
    <CesiumContext.Provider value={readyViewer}>
      <div
        id="cesiumContainer"
        className={className}
        style={{ width: '100%', height: '100%', background: '#030a18', position: 'relative', ...style }}
      >
        {children}
      </div>
    </CesiumContext.Provider>
  );
}
