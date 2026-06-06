'use client';

import { useEffect, useRef } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { CoveragePoint } from '../../types/coverage';
import type { MapInstance } from '../../lib/deck/_coverageStub';

interface CoverageHeatmapProps {
  points: CoveragePoint[];
  map: MapInstance | null;
}

function buildLayer(points: CoveragePoint[]) {
  return new HeatmapLayer<CoveragePoint>({
    id: 'coverage-heatmap',
    data: points,
    radiusPixels: 60,
    intensity: 1,
    threshold: 0.05,
    colorRange: [
      [68, 1, 84, 255],
      [33, 145, 140, 255],
      [253, 231, 37, 255],
    ],
    getPosition: (d: CoveragePoint) => [d.lng, d.lat],
    getWeight: (d: CoveragePoint) => d.signal,
  });
}

export default function CoverageHeatmap({ points, map }: CoverageHeatmapProps) {
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: [buildLayer(points)] });
    map.addControl(overlay);
    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setProps({ layers: [buildLayer(points)] });
  }, [points]);

  return null;
}
