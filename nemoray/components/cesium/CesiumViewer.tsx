'use client';

if (typeof window !== 'undefined') {
  (window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium';
}

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import React, { useEffect, useRef, useState } from 'react';
import { applyNightScene } from '@/lib/cesium/sceneEffects';
import { INITIAL_CAMERA } from '@/lib/cesium/viewerConfig';
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

    let cancelled = false;
    let viewer: Cesium.Viewer | null = null;

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

    const clearContainer = () => {
      const el = document.getElementById('cesiumContainer');
      if (!el) return;
      // Explicitly lose any held GL contexts before wiping the DOM so the
      // browser doesn't exhaust its per-page context limit across retries.
      el.querySelectorAll('canvas').forEach((canvas) => {
        const gl =
          canvas.getContext('webgl2') ??
          (canvas.getContext('webgl') as WebGL2RenderingContext | null);
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      });
      el.innerHTML = '';
    };

    // Async init with retry: after destroy(), the GPU may need a frame or two to
    // release the previous context before a new canvas.getContext() succeeds.
    (async () => {
      let lastError: unknown = null;

      outer: for (const requestWebgl1 of [false, true]) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return;

          if (attempt > 0) {
            clearContainer();
            // Wait for the GPU to release the previous WebGL context.
            await new Promise<void>((r) => setTimeout(r, 200 * attempt));
          }

          if (cancelled) return;

          try {
            viewer = new Cesium.Viewer('cesiumContainer', {
              ...sharedOptions,
              contextOptions: {
                requestWebgl1,
                allowTextureFilterAnisotropic: false,
                webgl: {
                  failIfMajorPerformanceCaveat: false,
                  antialias: false,
                  powerPreference: 'low-power',
                },
              },
            });
            lastError = null;
            break outer;
          } catch (err) {
            lastError = err;
            clearContainer();
          }
        }
      }

      if (cancelled) return;

      if (lastError || !viewer) {
        const msg = lastError instanceof Error ? lastError.message : String(lastError);
        console.error('Cesium init failed (WebGL2 + WebGL1, 3 attempts each):', lastError);
        setWebglError(msg);
        didInit.current = false;
      } else {
        applyNightScene(viewer);
        viewer.camera.flyTo(INITIAL_CAMERA);
        cesiumViewerRef.current = viewer;
        setReadyViewer(viewer);
        onReady?.(viewer);
      }
    })();

    return () => {
      cancelled = true;
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
        className={className}
        style={{ width: '100%', height: '100%', background: '#030a18', position: 'relative', ...style }}
      >
        {/* Cesium owns this node entirely — keep React children out of it */}
        <div id="cesiumContainer" style={{ position: 'absolute', inset: 0 }} />
        {children}
      </div>
    </CesiumContext.Provider>
  );
}
