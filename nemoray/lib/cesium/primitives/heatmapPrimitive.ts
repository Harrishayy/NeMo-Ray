import * as Cesium from 'cesium';
import type { CoveragePoint } from '@/types/coverage';

/**
 * Map a signal value in [0,1] to a color using a 5-stop scale with linear interpolation.
 */
export function signalToColor(signal: number): Cesium.Color {
  const stops: Array<{ t: number; color: Cesium.Color }> = [
    { t: 0.0, color: Cesium.Color.fromCssColorString('#b40000').withAlpha(0.8) },
    { t: 0.3, color: Cesium.Color.fromCssColorString('#ff5000').withAlpha(0.7) },
    { t: 0.6, color: Cesium.Color.fromCssColorString('#ffdc00').withAlpha(0.5) },
    { t: 0.8, color: Cesium.Color.fromCssColorString('#00dcb4').withAlpha(0.3) },
    { t: 1.0, color: Cesium.Color.fromCssColorString('#0064ff').withAlpha(0.1) },
  ];

  const clamped = Math.max(0, Math.min(1, signal));

  // Find the two stops to interpolate between
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].t && clamped <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const range = hi.t - lo.t;
  const f = range > 0 ? (clamped - lo.t) / range : 0;
  return Cesium.Color.lerp(lo.color, hi.color, f, new Cesium.Color());
}

/**
 * Create a GroundPrimitive heatmap overlay from an array of coverage points.
 */
export function createHeatmapPrimitive(
  _viewer: Cesium.Viewer,
  points: CoveragePoint[]
): Cesium.GroundPrimitive {
  const instances: Cesium.GeometryInstance[] = points.map((p) => {
    return new Cesium.GeometryInstance({
      geometry: new Cesium.CircleGeometry({
        center: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
        radius: 300,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(signalToColor(p.signal)),
      },
    });
  });

  return new Cesium.GroundPrimitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({ flat: true }),
  });
}
