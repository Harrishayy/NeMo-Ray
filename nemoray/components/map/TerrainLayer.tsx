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
          tiles: [
            `https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
          ],
          tileSize: 256,
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
