'use client';

import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

export default function TerrainLayer() {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();

    function addTerrain() {
      const sourceId = 'terrain-dem';

      if (!mapInstance.getSource(sourceId)) {
        mapInstance.addSource(sourceId, {
          type: 'raster-dem',
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
          tileSize: 512,
          encoding: 'mapbox',
        });
      }

      mapInstance.setTerrain({ source: sourceId, exaggeration: 1.2 });
    }

    if (mapInstance.isStyleLoaded()) {
      addTerrain();
    } else {
      mapInstance.on('load', addTerrain);
      return () => {
        mapInstance.off('load', addTerrain);
      };
    }
  }, [map]);

  return null;
}
