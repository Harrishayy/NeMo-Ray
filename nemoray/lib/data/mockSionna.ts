import type { RadioMap, CoveragePoint, DeadZone } from '../../types/coverage';

// London bbox: [minLng, minLat, maxLng, maxLat]
const LONDON_BBOX = [-0.510, 51.286, 0.334, 51.686] as const;

// Mulberry32 seeded PRNG — returns values in [0, 1)
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Dead zones in outer East/South London (low signal clusters)
const DEAD_ZONE_CENTRES = [
  { lat: 51.51, lng: 0.05 },   // Barking/Dagenham
  { lat: 51.38, lng: -0.07 },  // Croydon south
  { lat: 51.47, lng: 0.12 },   // Bexley
  { lat: 51.32, lng: -0.22 },  // Sutton/Epsom fringe
];

export function generateRadioMap(seed = 42): RadioMap {
  const rand = mulberry32(seed);
  const points: CoveragePoint[] = [];
  const [minLng, minLat, maxLng, maxLat] = LONDON_BBOX;

  for (let i = 0; i < 2000; i++) {
    const lng = minLng + rand() * (maxLng - minLng);
    const lat = minLat + rand() * (maxLat - minLat);

    // Base signal: reduce toward edges
    let signal = 0.4 + rand() * 0.6;

    // Apply dead-zone attenuation
    for (const dz of DEAD_ZONE_CENTRES) {
      const dist = Math.sqrt((lat - dz.lat) ** 2 + (lng - dz.lng) ** 2);
      if (dist < 0.08) {
        signal *= 0.2 + (dist / 0.08) * 0.4;
      }
    }

    points.push({ lat, lng, signal: Math.max(0, Math.min(1, signal)) });
  }

  return {
    generated_at: new Date().toISOString(),
    bbox: [...LONDON_BBOX],
    resolution_m: 100,
    points,
  };
}

// Small polygons centred on the dead-zone clusters
export const LONDON_DEAD_ZONES: DeadZone[] = [
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0.03, 51.50], [0.07, 51.50], [0.07, 51.54], [0.03, 51.54], [0.03, 51.50],
      ]],
    },
    properties: { area_km2: 12.4, avg_signal_deficit: 0.72 },
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-0.10, 51.35], [-0.04, 51.35], [-0.04, 51.40], [-0.10, 51.40], [-0.10, 51.35],
      ]],
    },
    properties: { area_km2: 8.7, avg_signal_deficit: 0.65 },
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [0.09, 51.44], [0.15, 51.44], [0.15, 51.49], [0.09, 51.49], [0.09, 51.44],
      ]],
    },
    properties: { area_km2: 9.1, avg_signal_deficit: 0.68 },
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-0.25, 51.29], [-0.19, 51.29], [-0.19, 51.34], [-0.25, 51.34], [-0.25, 51.29],
      ]],
    },
    properties: { area_km2: 7.3, avg_signal_deficit: 0.61 },
  },
];
