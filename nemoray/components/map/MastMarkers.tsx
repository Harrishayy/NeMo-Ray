'use client';

import { useEffect, useRef } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MastSite } from '../../types/coverage';
import type { MapInstance } from '../../lib/deck/_coverageStub';

interface MastMarkersProps {
  sites: MastSite[];
  map: MapInstance | null;
}

function buildLayers(data: MastSite[]) {
  const active = data.filter((s) => s.active);
  const inactive = data.filter((s) => !s.active);

  return [
    new ScatterplotLayer<MastSite>({
      id: 'mast-markers-active',
      data: active,
      getPosition: (d: MastSite) => [d.lng, d.lat],
      getFillColor: [0, 200, 100, 255],
      getRadius: 80,
      radiusUnits: 'meters',
      pickable: true,
    }),
    new ScatterplotLayer<MastSite>({
      id: 'mast-markers-inactive',
      data: inactive,
      getPosition: (d: MastSite) => [d.lng, d.lat],
      getFillColor: [220, 50, 50, 255],
      getRadius: 60,
      radiusUnits: 'meters',
      pickable: true,
    }),
  ];
}

export default function MastMarkers({ sites, map }: MastMarkersProps) {
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: buildLayers(sites) });
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
    overlayRef.current.setProps({ layers: buildLayers(sites) });
  }, [sites]);

  return null;
}
