/**
 * Unit tests for PathPrimitiveManager.
 *
 * Strategy: mock the entire `cesium` module so no WebGL context is required.
 * We stub only the classes actually used by PathPrimitiveManager:
 *   Primitive, GeometryInstance, PolylineGeometry, PolylineMaterialAppearance.
 * The viewer stub provides a scene.primitives collection that tracks add/remove calls.
 */

// ─── Cesium module mock ──────────────────────────────────────────────────────

// Minimal Cesium.Cartesian3 implementation that satisfies pathMath's real
// imports (which run in the same Jest module graph).
class MockCartesian3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
  static fromDegrees(_lon: number, _lat: number, _h = 0) {
    return new MockCartesian3(_lon, _lat, _h);
  }
  static midpoint(a: MockCartesian3, _b: MockCartesian3, out: MockCartesian3) {
    out.x = a.x; out.y = a.y; out.z = a.z;
    return out;
  }
  static normalize(v: MockCartesian3, out: MockCartesian3) {
    out.x = v.x; out.y = v.y; out.z = v.z;
    return out;
  }
  static magnitude(_v: MockCartesian3) { return 6_371_000; }
  static multiplyByScalar(v: MockCartesian3, s: number, out: MockCartesian3) {
    out.x = v.x * s; out.y = v.y * s; out.z = v.z * s;
    return out;
  }
  static distance(_a: MockCartesian3, _b: MockCartesian3) { return 100_000; }
  static subtract(a: MockCartesian3, b: MockCartesian3, out: MockCartesian3) {
    out.x = a.x - b.x; out.y = a.y - b.y; out.z = a.z - b.z;
    return out;
  }
  static cross(_a: MockCartesian3, _b: MockCartesian3, out: MockCartesian3) {
    return out;
  }
  static add(a: MockCartesian3, b: MockCartesian3, out: MockCartesian3) {
    out.x = a.x + b.x; out.y = a.y + b.y; out.z = a.z + b.z;
    return out;
  }
  static clone(v: MockCartesian3) {
    return new MockCartesian3(v.x, v.y, v.z);
  }
}

// Track constructed Primitive instances so tests can inspect add/remove calls.
const constructedPrimitives: MockPrimitive[] = [];

class MockPrimitive {
  constructor(public _opts?: unknown) {
    constructedPrimitives.push(this);
  }
  destroy() {}
  isDestroyed() { return false; }
}

class MockGeometryInstance {
  constructor(public _opts?: unknown) {}
}

class MockPolylineGeometry {
  constructor(public _opts?: unknown) {}
}

const MOCK_VERTEX_FORMAT = {};

class MockPolylineMaterialAppearance {
  material: unknown;
  constructor(opts?: { material?: unknown; translucent?: boolean }) {
    this.material = opts?.material;
  }
  static VERTEX_FORMAT = MOCK_VERTEX_FORMAT;
}

jest.mock('cesium', () => ({
  Cartesian3: MockCartesian3,
  Primitive: MockPrimitive,
  GeometryInstance: MockGeometryInstance,
  PolylineGeometry: MockPolylineGeometry,
  PolylineMaterialAppearance: MockPolylineMaterialAppearance,
}));

// ─── Module under test ───────────────────────────────────────────────────────

import { PathPrimitiveManager } from '@/lib/cesium/signal/geometry/PathPrimitiveManager';
import type { SignalPath } from '@/lib/cesium/signal/contract/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePath(id: string, siteId = 'site-a', overrides: Partial<SignalPath> = {}): SignalPath {
  return {
    id,
    siteId,
    start: { lon: -0.02, lat: 51.50, height: 0 },
    end:   { lon: -0.12, lat: 51.52, height: 0 },
    bend: 0.2,
    archeight: 0,
    utilisation: 0.5,
    ...overrides,
  };
}

function makeViewerStub() {
  const added: unknown[] = [];
  const removed: unknown[] = [];

  const primitives = {
    add: jest.fn((p: unknown) => { added.push(p); return p; }),
    remove: jest.fn((p: unknown) => { removed.push(p); return true; }),
    contains: jest.fn((p: unknown) => added.includes(p) && !removed.includes(p)),
    removeAll: jest.fn(() => { removed.push(...added); }),
    destroyPrimitives: jest.fn(),
    _added: added,
    _removed: removed,
  };

  return {
    scene: { primitives },
  } as unknown as import('cesium').Viewer;
}

function makeMaterialFactory() {
  return jest.fn((_p: SignalPath) => ({ type: 'mock-material', uniforms: {} })) as unknown as
    (p: SignalPath) => import('cesium').Material;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  constructedPrimitives.length = 0;
});

describe('PathPrimitiveManager.build', () => {
  it('adds one primitive per path', () => {
    const viewer = makeViewerStub();
    const factory = makeMaterialFactory();
    const manager = new PathPrimitiveManager(viewer, factory);

    const paths = [makePath('p1'), makePath('p2'), makePath('p3')];
    manager.build(paths);

    expect(viewer.scene.primitives.add).toHaveBeenCalledTimes(3);
  });

  it('calls materialFactory once per path', () => {
    const viewer = makeViewerStub();
    const factory = makeMaterialFactory();
    const manager = new PathPrimitiveManager(viewer, factory);

    const paths = [makePath('p1'), makePath('p2'), makePath('p3')];
    manager.build(paths);

    expect(factory).toHaveBeenCalledTimes(3);
    expect(factory).toHaveBeenCalledWith(paths[0]);
    expect(factory).toHaveBeenCalledWith(paths[1]);
    expect(factory).toHaveBeenCalledWith(paths[2]);
  });
});

describe('PathPrimitiveManager.getMaterial', () => {
  it('returns the material created for a path', () => {
    const viewer = makeViewerStub();
    let callCount = 0;
    const materials: import('cesium').Material[] = [];
    const factory = jest.fn((p: SignalPath) => {
      const m = { type: `mat-${callCount++}`, uniforms: {} } as unknown as import('cesium').Material;
      materials.push(m);
      return m;
    });
    const manager = new PathPrimitiveManager(viewer, factory);

    const paths = [makePath('pa'), makePath('pb')];
    manager.build(paths);

    expect(manager.getMaterial('pa')).toBe(materials[0]);
    expect(manager.getMaterial('pb')).toBe(materials[1]);
  });

  it('returns undefined for an unknown PathId', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());
    expect(manager.getMaterial('does-not-exist')).toBeUndefined();
  });
});

describe('PathPrimitiveManager.rebuild', () => {
  it('does not recreate primitives when topology is unchanged', () => {
    const viewer = makeViewerStub();
    const factory = makeMaterialFactory();
    const manager = new PathPrimitiveManager(viewer, factory);

    const paths = [makePath('r1'), makePath('r2')];
    manager.build(paths);

    // rebuild with identical paths — no removes, no new adds.
    const addCount = (viewer.scene.primitives.add as jest.Mock).mock.calls.length;
    manager.rebuild([...paths]);

    expect(viewer.scene.primitives.remove).not.toHaveBeenCalled();
    expect((viewer.scene.primitives.add as jest.Mock).mock.calls.length).toBe(addCount);
  });

  it('removes a stale path and does not add a new one', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());

    const paths = [makePath('s1'), makePath('s2')];
    manager.build(paths);

    // Rebuild with s2 removed.
    manager.rebuild([makePath('s1')]);

    expect(viewer.scene.primitives.remove).toHaveBeenCalledTimes(1);
    expect(manager.getMaterial('s2')).toBeUndefined();
  });

  it('rebuilds a path whose topology changed', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());

    const original = makePath('t1', 'site-a', { bend: 0.2 });
    manager.build([original]);

    const addsBefore = (viewer.scene.primitives.add as jest.Mock).mock.calls.length;

    // Change bend — this is a topology change.
    const rerouted = makePath('t1', 'site-a', { bend: 0.9 });
    manager.rebuild([rerouted]);

    expect(viewer.scene.primitives.remove).toHaveBeenCalledTimes(1);
    expect((viewer.scene.primitives.add as jest.Mock).mock.calls.length).toBe(addsBefore + 1);
  });

  it('adds a brand-new path', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());

    manager.build([makePath('n1')]);
    const addsBefore = (viewer.scene.primitives.add as jest.Mock).mock.calls.length;

    manager.rebuild([makePath('n1'), makePath('n2')]);

    expect((viewer.scene.primitives.add as jest.Mock).mock.calls.length).toBe(addsBefore + 1);
  });
});

describe('PathPrimitiveManager.destroy', () => {
  it('removes all primitives from scene.primitives', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());

    manager.build([makePath('d1'), makePath('d2'), makePath('d3')]);
    manager.destroy();

    expect(viewer.scene.primitives.remove).toHaveBeenCalledTimes(3);
  });

  it('clears the internal material map', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());

    manager.build([makePath('d4'), makePath('d5')]);
    manager.destroy();

    expect(manager.getMaterial('d4')).toBeUndefined();
    expect(manager.getMaterial('d5')).toBeUndefined();
  });

  it('is safe to call on an empty manager', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());
    expect(() => manager.destroy()).not.toThrow();
  });

  it('is safe to call twice', () => {
    const viewer = makeViewerStub();
    const manager = new PathPrimitiveManager(viewer, makeMaterialFactory());
    manager.build([makePath('d6')]);
    manager.destroy();
    expect(() => manager.destroy()).not.toThrow();
  });
});
