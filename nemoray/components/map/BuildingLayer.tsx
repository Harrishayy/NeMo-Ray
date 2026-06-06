'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

export default function BuildingLayer() {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();

    function addBuildings() {
      if (!mapInstance.getSource('openmaptiles')) return;

      if (!mapInstance.getLayer('buildings-3d')) {
        mapInstance.addLayer({
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          paint: {
            'fill-extrusion-color': '#aac0d6',
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
          },
        });
      }
    }

    if (mapInstance.isStyleLoaded()) {
      addBuildings();
    } else {
      mapInstance.on('load', addBuildings);
      return () => {
        mapInstance.off('load', addBuildings);
      };
    }
  }, [map]);

  return null;
}
