const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
if (!MAPTILER_KEY) {
  console.warn(
    '[NeMo-Ray] NEXT_PUBLIC_MAPTILER_KEY is not set — map tiles will fail to load. ' +
    'Copy .env.example to .env.local and add your free key from maptiler.com'
  );
}

export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY ?? ''}`;

export const INITIAL_VIEW = {
  longitude: -0.1278,
  latitude: 51.5074,
  zoom: 11,
  pitch: 45,
  bearing: -10,
} as const;
