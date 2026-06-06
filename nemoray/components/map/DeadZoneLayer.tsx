'use client';

import { useEffect, useRef } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { DeadZone } from '../../types/coverage';
import type { MapInstance } from '../../lib/deck/_coverageStub';

interface DeadZoneLayerProps {
  deadZones: DeadZone[];
  map: MapInstance | null;
}

function buildLayer(data: DeadZone[]) {
  return new GeoJsonLayer<DeadZone>({
    id: 'dead-zone-layer',
    data: data,
    getFillColor: [220, 50, 50, 64],
    getLineColor: [220, 50, 50, 255],
    lineWidthMinPixels: 1,
    pickable: true,
  });
}

export default function DeadZoneLayer({ deadZones, map }: DeadZoneLayerProps) {
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: [buildLayer(deadZones)] });
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
    overlayRef.current.setProps({ layers: [buildLayer(deadZones)] });
  }, [deadZones]);

  return null;
}
