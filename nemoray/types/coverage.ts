import type { Feature, Polygon, BBox } from 'geojson';

export type CoveragePoint = {
  lat: number;
  lng: number;
  signal: number; // 0–1, where 1 is full signal
};

export type MastSite = {
  id: string;
  lat: number;
  lng: number;
  active: boolean;
};

export type Proposal = {
  id: string;
  lat: number;
  lng: number;
  score: number; // 0–1
  accepted: boolean;
  reason: string; // explanation from Nemotron (empty string if accepted)
};

export type DeadZone = Feature<Polygon, {
  area_km2: number;
  avg_signal_deficit: number;
}>;

export type RadioMap = {
  generated_at: string;  // ISO 8601
  bbox: BBox;            // [minLng, minLat, maxLng, maxLat]
  resolution_m: number;
  points: CoveragePoint[];
};
