import { samplePath, interpAlong } from '@/lib/cesium/signal/contract/pathMath';
import { utilColorJS } from '@/lib/cesium/signal/contract/colorRamp';
import type { SignalPath } from '@/lib/cesium/signal/contract/types';

// A London tower path: Canary Wharf tower → suburban edge
const FIXTURE: SignalPath = {
  id: 'test-path',
  siteId: 'canary-wharf',
  start: { lon: -0.0235, lat: 51.5055, height: 0 },
  end:   { lon: -0.1200, lat: 51.5200, height: 0 },
  bend: 0.2,
  archeight: 0,
  utilisation: 0.5,
};

describe('samplePath', () => {
  it('returns segments+1 points', () => {
    const pts = samplePath(FIXTURE, 48);
    expect(pts).toHaveLength(49);
  });

  it('first point is near start, last is near end', () => {
    const pts = samplePath(FIXTURE, 48);
    const start = pts[0];
    const end = pts[pts.length - 1];

    // Convert back to degrees via Cesium for assertion
    const { Cartesian3, Cartographic } = require('cesium');
    const startCarto = Cartographic.fromCartesian(start);
    const endCarto = Cartographic.fromCartesian(end);

    expect(startCarto.longitude * 180 / Math.PI).toBeCloseTo(FIXTURE.start.lon, 2);
    expect(startCarto.latitude * 180 / Math.PI).toBeCloseTo(FIXTURE.start.lat, 2);
    expect(endCarto.longitude * 180 / Math.PI).toBeCloseTo(FIXTURE.end.lon, 2);
    expect(endCarto.latitude * 180 / Math.PI).toBeCloseTo(FIXTURE.end.lat, 2);
  });

  it('bend produces a lateral offset at the midpoint', () => {
    const { Cartesian3, Cartographic } = require('cesium');

    const bent   = samplePath({ ...FIXTURE, bend: 0.3 }, 48);
    const straight = samplePath({ ...FIXTURE, bend: 0.0 }, 48);

    const midBent     = bent[24];
    const midStraight = straight[24];

    // Midpoints should differ when bend != 0
    const dist = Cartesian3.distance(midBent, midStraight);
    expect(dist).toBeGreaterThan(100); // at least 100 m offset
  });

  it('produces monotonically increasing arc-length progress', () => {
    const { Cartesian3 } = require('cesium');
    const pts = samplePath(FIXTURE, 48);
    let prevLen = 0;
    let totalLen = 0;
    for (let i = 1; i < pts.length; i++) {
      const seg = Cartesian3.distance(pts[i - 1], pts[i]);
      expect(seg).toBeGreaterThan(0); // no zero-length segments
      totalLen += seg;
    }
    expect(totalLen).toBeGreaterThan(0);
  });
});

describe('interpAlong', () => {
  it('returns start at f=0', () => {
    const { Cartesian3 } = require('cesium');
    const pts = samplePath(FIXTURE, 8);
    const result = interpAlong(pts, 0);
    expect(Cartesian3.distance(result, pts[0])).toBeLessThan(1e-3);
  });

  it('returns end at f=1', () => {
    const { Cartesian3 } = require('cesium');
    const pts = samplePath(FIXTURE, 8);
    const result = interpAlong(pts, 1);
    expect(Cartesian3.distance(result, pts[pts.length - 1])).toBeLessThan(1e-3);
  });
});

describe('utilColorJS', () => {
  it('returns green at u=0', () => {
    const [r, g, b] = utilColorJS(0);
    expect(r).toBeCloseTo(0.0);
    expect(g).toBeCloseTo(1.0);
  });

  it('returns yellow at u=0.5', () => {
    const [r, g, b] = utilColorJS(0.5);
    expect(r).toBeCloseTo(1.0);
    expect(g).toBeCloseTo(1.0);
  });

  it('returns red at u=1', () => {
    const [r, g, b] = utilColorJS(1.0);
    expect(r).toBeCloseTo(1.0);
    expect(g).toBeCloseTo(0.0);
  });

  it('matches GLSL ramp at midpoints (green-yellow boundary at u=0.5)', () => {
    // At u=0.25: midway between green and yellow
    const [r, g, b] = utilColorJS(0.25);
    expect(r).toBeCloseTo(0.5, 1);
    expect(g).toBeCloseTo(1.0, 1);
  });
});
