import type { BBox, LngLat } from "@/lib/types";

/** Central-London working bounds: [minLng, minLat, maxLng, maxLat]. */
export const LONDON_BBOX: BBox = [-0.205, 51.46, 0.01, 51.555];

export const LONDON_CENTER: LngLat = [
  (LONDON_BBOX[0] + LONDON_BBOX[2]) / 2,
  (LONDON_BBOX[1] + LONDON_BBOX[3]) / 2,
];

/** Default camera the real Cesium scene should adopt. */
export const DEFAULT_VIEW = {
  longitude: LONDON_CENTER[0],
  latitude: LONDON_CENTER[1],
  zoom: 12.4,
  pitch: 55,
  bearing: -18,
} as const;

/** Project a lng/lat into normalized [0,1] space within a bbox (y flipped: 0 = north). */
export function lngLatToNorm(
  [lng, lat]: LngLat,
  bbox: BBox = LONDON_BBOX,
): { x: number; y: number } {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    x: (lng - minLng) / (maxLng - minLng),
    y: 1 - (lat - minLat) / (maxLat - minLat),
  };
}

/** Inverse of {@link lngLatToNorm}. */
export function normToLngLat(
  { x, y }: { x: number; y: number },
  bbox: BBox = LONDON_BBOX,
): LngLat {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [minLng + x * (maxLng - minLng), minLat + (1 - y) * (maxLat - minLat)];
}
