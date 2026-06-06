import * as Cesium from 'cesium';
import type { SignalPath, GeoPoint } from './types';

// Reusable scratch objects — never allocate in the hot path.
const _scratch0 = new Cesium.Cartesian3();
const _scratch1 = new Cesium.Cartesian3();
const _scratchNorm = new Cesium.Cartesian3();

function toCartesian(p: GeoPoint): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height ?? 0);
}

/**
 * Lateral perpendicular direction in world space at a surface point.
 * Returns a unit vector 90° to the start→end direction, tangent to the ellipsoid.
 */
function lateralDir(
  start: Cesium.Cartesian3,
  end: Cesium.Cartesian3,
  surfaceNormal: Cesium.Cartesian3,
): Cesium.Cartesian3 {
  const along = Cesium.Cartesian3.subtract(end, start, _scratch0);
  const lateral = Cesium.Cartesian3.cross(along, surfaceNormal, _scratch1);
  return Cesium.Cartesian3.normalize(lateral, _scratchNorm);
}

/**
 * Returns N world-space Cartesian3 sample points for a path.
 * Both geometry (A) and particles (C) call this so dots stay glued to lines.
 *
 * Technique: quadratic Bezier with one control point at the arc midpoint.
 * The control point is offset:
 *   - laterally by `bend` × chord length (perpendicular to great-circle axis)
 *   - vertically by `archeight` metres (above surface)
 */
export function samplePath(path: SignalPath, segments = 48): Cesium.Cartesian3[] {
  const bend = path.bend ?? 0.2;
  const archeight = path.archeight ?? 0;

  const p0 = toCartesian(path.start);
  const p2 = toCartesian(path.end);

  // Midpoint on the ellipsoid (geodesic midpoint approximation via lerp + normalize)
  const midCartesian = Cesium.Cartesian3.midpoint(p0, p2, new Cesium.Cartesian3());
  const midOnSurface = Cesium.Cartesian3.normalize(midCartesian, new Cesium.Cartesian3());
  // Scale back to ellipsoid surface
  const ellipsoidRadius = Cesium.Cartesian3.magnitude(p0); // approximate
  Cesium.Cartesian3.multiplyByScalar(midOnSurface, ellipsoidRadius, midOnSurface);

  // Surface normal at midpoint (used for lateral offset direction)
  const surfaceNormal = Cesium.Cartesian3.normalize(midOnSurface, new Cesium.Cartesian3());

  // Chord length for scaling the bend offset
  const chord = Cesium.Cartesian3.distance(p0, p2);

  // Lateral bend: perpendicular to the path in the horizontal plane
  const lateral = lateralDir(p0, p2, surfaceNormal);

  // Construct control point
  const p1 = new Cesium.Cartesian3();
  Cesium.Cartesian3.clone(midOnSurface, p1);
  // Apply lateral bend
  Cesium.Cartesian3.add(
    p1,
    Cesium.Cartesian3.multiplyByScalar(lateral, bend * chord * 0.5, new Cesium.Cartesian3()),
    p1,
  );
  // Apply vertical arc
  if (archeight !== 0) {
    Cesium.Cartesian3.add(
      p1,
      Cesium.Cartesian3.multiplyByScalar(surfaceNormal, archeight, new Cesium.Cartesian3()),
      p1,
    );
  }

  // Sample quadratic Bezier: B(t) = (1-t)²p0 + 2(1-t)t·p1 + t²p2
  const result: Cesium.Cartesian3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const pt = new Cesium.Cartesian3(
      mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
    );
    result.push(pt);
  }
  return result;
}

/**
 * Linearly interpolate a position along a pre-sampled path by normalised age 0..1.
 * Used by the particle system updateCallback to move dots along the polyline.
 */
export function interpAlong(pts: Cesium.Cartesian3[], f: number): Cesium.Cartesian3 {
  if (pts.length === 0) return new Cesium.Cartesian3();
  if (f <= 0) return Cesium.Cartesian3.clone(pts[0]);
  if (f >= 1) return Cesium.Cartesian3.clone(pts[pts.length - 1]);

  const raw = f * (pts.length - 1);
  const lo = Math.floor(raw);
  const t = raw - lo;
  const hi = Math.min(lo + 1, pts.length - 1);
  return new Cesium.Cartesian3(
    pts[lo].x + (pts[hi].x - pts[lo].x) * t,
    pts[lo].y + (pts[hi].y - pts[lo].y) * t,
    pts[lo].z + (pts[hi].z - pts[lo].z) * t,
  );
}
