export type CoveragePoint = { lat: number; lng: number; signal: number }
export type MastSite = { id: string; lat: number; lng: number; active: boolean }
export type Proposal = { id: string; lat: number; lng: number; score: number; accepted: boolean; reason: string }
export type DeadZone = { type: 'Feature'; geometry: { type: 'Polygon'; coordinates: number[][][] }; properties: { area_km2: number; avg_signal_deficit: number } }

/** Minimal IControl shape — matches MapboxOverlay's actual signature. */
export interface DeckControl {
  onAdd(map: unknown): HTMLElement;
  onRemove(): void;
}

/**
 * Minimal map interface compatible with both Mapbox GL JS and MapLibre GL JS.
 * Typed to accept deck.gl's MapboxOverlay (which implements IControl).
 */
export interface MapInstance {
  addControl(control: DeckControl, position?: string): unknown;
  removeControl(control: DeckControl): unknown;
}
