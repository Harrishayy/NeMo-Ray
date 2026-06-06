import type { MapRef } from 'react-map-gl/maplibre';
import { PRESETS, startOrbit, type PresetName } from './transitions';

export class CameraController {
  constructor(private mapRef: React.RefObject<MapRef | null>) {}

  private get map() { return this.mapRef.current; }

  flyToProposal(proposal: { lat: number; lng: number }, preset: PresetName): void {
    const p = PRESETS[preset];
    this.map?.flyTo({
      center: [proposal.lng, proposal.lat],
      zoom: p.zoom,
      pitch: p.pitch,
      bearing: p.bearing,
      duration: p.duration,
    });
  }

  flyToOverview(): void {
    const p = PRESETS.OVERVIEW;
    this.map?.flyTo({
      center: [-0.1278, 51.5074],
      zoom: p.zoom,
      pitch: p.pitch,
      bearing: p.bearing,
      duration: p.duration,
    });
  }

  orbit(durationMs: number): () => void {
    const map = this.map;
    if (!map) return () => {};
    return startOrbit(
      ({ bearing, duration }) => map.flyTo({ bearing, duration }),
      durationMs
    );
  }

  fitBounds(bbox: [[number, number], [number, number]]): void {
    this.map?.fitBounds(bbox, { padding: 40, duration: 1500 });
  }
}
