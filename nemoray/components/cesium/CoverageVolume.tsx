'use client';
import React, { useEffect } from 'react';
import * as Cesium from 'cesium';
import { cesiumViewerRef } from './CesiumViewer';
import type { CoveragePoint } from '@/types/coverage';
import { createHeatmapPrimitive } from '@/lib/cesium/primitives/heatmapPrimitive';

interface CoverageVolumeProps {
  points: CoveragePoint[];
}

export default function CoverageVolume({ points }: CoverageVolumeProps): null {
  useEffect(() => {
    const viewer = cesiumViewerRef.current;
    if (!viewer) return;

    const primitive = createHeatmapPrimitive(viewer, points);
    viewer.scene.groundPrimitives.add(primitive);

    // TODO: Low-signal pulse effect (1 Hz sin oscillation, alpha 0.4–0.9 for signal < 0.4).
    // GroundPrimitive does not support runtime per-instance color updates via
    // getGeometryInstanceAttribute after creation — the attribute is baked at
    // construction time and cannot be mutated on a GroundPrimitive (unlike
    // Primitive which supports INTERLEAVE_GEOMETRY = false + perInstanceColorAppearance).
    // To implement this effect, replace GroundPrimitive with a Primitive and
    // set allow_picking: false, releaseGeometryInstances: false so that
    // getGeometryInstanceAttribute works at runtime.

    return () => {
      viewer.scene.groundPrimitives.remove(primitive);
    };
  }, [points]);

  return null;
}
