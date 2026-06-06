'use client';

import React from 'react';
import { Map, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE, INITIAL_VIEW } from '@/lib/maplibre/config';

interface MapCanvasProps {
  mapRef?: React.RefObject<MapRef | null>;
  children?: React.ReactNode;
  onLoad?: () => void;
}

export default function MapCanvas({ mapRef, children, onLoad }: MapCanvasProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        onLoad={onLoad}
      >
        {children}
      </Map>
    </div>
  );
}
