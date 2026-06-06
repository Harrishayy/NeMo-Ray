import * as Cesium from 'cesium';
import type { MastSite } from '@/types/coverage';

/**
 * Create a glowing arc entity between two mast sites.
 */
export function createSignalArc(
  viewer: Cesium.Viewer,
  from: MastSite,
  to: MastSite,
  color: Cesium.Color
): Cesium.Entity {
  const startPos = Cesium.Cartesian3.fromDegrees(from.lng, from.lat, 80);
  const endPos = Cesium.Cartesian3.fromDegrees(to.lng, to.lat, 80);

  const distance = Cesium.Cartesian3.distance(startPos, endPos);
  const midElevation = Math.min(Math.max(distance * 0.3, 800), 1500);

  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;
  const midPos = Cesium.Cartesian3.fromDegrees(midLng, midLat, midElevation);

  const spline = new Cesium.CatmullRomSpline({
    times: [0, 0.5, 1],
    points: [startPos, midPos, endPos],
  });

  const sampledPositions: Cesium.Cartesian3[] = [];
  for (let i = 0; i < 32; i++) {
    const t = i / 31;
    sampledPositions.push(spline.evaluate(t));
  }

  return viewer.entities.add({
    polyline: {
      positions: sampledPositions,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        taperPower: 0.8,
        color,
      }),
      width: 3,
      clampToGround: false,
    },
  });
}
