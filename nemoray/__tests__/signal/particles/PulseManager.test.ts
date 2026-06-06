/**
 * PulseManager unit tests
 *
 * Strategy: mock Cesium entirely so we run in a plain Node environment
 * (no WebGL, no DOM canvas needed). We capture constructor options and
 * track add/remove calls on the primitives collection.
 */

import type { SignalPath } from '@/lib/cesium/signal/contract/types';

// --------------------------------------------------------------------------
// Cesium mock — must be declared before importing PulseManager
// --------------------------------------------------------------------------

const addedSystems: object[] = [];
const removedSystems: object[] = [];

/** Minimal Cesium.Particle-like object returned by Cesium type-check path */
class MockParticle {
  normalizedAge = 0;
  position = { x: 0, y: 0, z: 0 };
}

/** Records constructor options so tests can inspect them */
const capturedOptions: object[] = [];

class MockParticleSystem {
  emissionRate: number;
  startColor: object;
  endColor: object;
  minimumImageSize: object;
  maximumImageSize: object;

  constructor(opts: Record<string, unknown>) {
    capturedOptions.push(opts);
    this.emissionRate = (opts.emissionRate as number) ?? 0;
    this.startColor = (opts.startColor as object) ?? {};
    this.endColor = (opts.endColor as object) ?? {};
    this.minimumImageSize = (opts.minimumImageSize as object) ?? {};
    this.maximumImageSize = (opts.maximumImageSize as object) ?? {};
  }
}

class MockCircleEmitter {
  constructor(_radius: number) {}
}

class MockCartesian2 {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class MockCartesian3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
  static fromDegrees(lon: number, lat: number, height = 0) {
    // Approximate ECEF: just store as a tagged object, magnitude tests not needed here
    return new MockCartesian3(lon, lat, height);
  }
  static magnitude(_v: MockCartesian3) { return 6_371_000; }
  static normalize(v: MockCartesian3, out: MockCartesian3) {
    Object.assign(out, v); return out;
  }
  static midpoint(a: MockCartesian3, b: MockCartesian3, out: MockCartesian3) {
    out.x = (a.x + b.x) / 2;
    out.y = (a.y + b.y) / 2;
    out.z = (a.z + b.z) / 2;
    return out;
  }
  static distance() { return 10_000; }
  static subtract(a: MockCartesian3, b: MockCartesian3, out: MockCartesian3) {
    out.x = a.x - b.x; out.y = a.y - b.y; out.z = a.z - b.z; return out;
  }
  static cross(_a: MockCartesian3, _b: MockCartesian3, out: MockCartesian3) {
    return out;
  }
  static add(a: MockCartesian3, b: MockCartesian3, out: MockCartesian3) {
    out.x = a.x + b.x; out.y = a.y + b.y; out.z = a.z + b.z; return out;
  }
  static multiplyByScalar(v: MockCartesian3, s: number, out: MockCartesian3) {
    out.x = v.x * s; out.y = v.y * s; out.z = v.z * s; return out;
  }
  static clone(v: MockCartesian3) { return new MockCartesian3(v.x, v.y, v.z); }
}

class MockColor {
  constructor(
    public r = 1,
    public g = 1,
    public b = 1,
    public a = 1,
  ) {}
  withAlpha(a: number) { return new MockColor(this.r, this.g, this.b, a); }
}

class MockMatrix4 {
  static IDENTITY = new MockMatrix4();
  clone() { return new MockMatrix4(); }
}

// Stub document.createElement so glowDotCanvas() doesn't crash in Node
const mockContext = {
  createRadialGradient: () => ({
    addColorStop: () => {},
  }),
  fillRect: () => {},
  fillStyle: '',
};
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: () => mockContext,
};

// Patch global document before module load
(global as Record<string, unknown>).document = {
  createElement: (_tag: string) => ({ ...mockCanvas }),
};

jest.mock('cesium', () => ({
  Particle: MockParticle,
  ParticleSystem: MockParticleSystem,
  CircleEmitter: MockCircleEmitter,
  Cartesian2: MockCartesian2,
  Cartesian3: MockCartesian3,
  Color: MockColor,
  Matrix4: MockMatrix4,
}));

// --------------------------------------------------------------------------
// Subject under test — imported after mocks are wired
// --------------------------------------------------------------------------

import { PulseManager } from '@/lib/cesium/signal/particles/PulseManager';

// --------------------------------------------------------------------------
// Fixture
// --------------------------------------------------------------------------

const FIXTURE: SignalPath = {
  id: 'path-1',
  siteId: 'tower-a',
  start: { lon: -0.0235, lat: 51.5055, height: 0 },
  end:   { lon: -0.1200, lat: 51.5200, height: 0 },
  bend: 0.2,
  archeight: 0,
  utilisation: 0.5,
};

function makeViewer() {
  return {
    scene: {
      primitives: {
        add: jest.fn((s: object) => { addedSystems.push(s); return s; }),
        remove: jest.fn((s: object) => { removedSystems.push(s); }),
      },
    },
  } as unknown as import('cesium').Viewer;
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

beforeEach(() => {
  addedSystems.length = 0;
  removedSystems.length = 0;
  capturedOptions.length = 0;
});

describe('PulseManager.build', () => {
  it('adds one ParticleSystem to scene.primitives per path', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);

    manager.build([FIXTURE]);

    expect(viewer.scene.primitives.add).toHaveBeenCalledTimes(1);
    expect(addedSystems).toHaveLength(1);
    expect(addedSystems[0]).toBeInstanceOf(MockParticleSystem);
  });

  it('stores captured emissionRate = 4 * utilisation', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    manager.build([FIXTURE]);

    const opts = capturedOptions[0] as { emissionRate: number };
    expect(opts.emissionRate).toBeCloseTo(4 * FIXTURE.utilisation);
  });

  it('adds N systems for N paths', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    const path2: SignalPath = { ...FIXTURE, id: 'path-2' };

    manager.build([FIXTURE, path2]);

    expect(viewer.scene.primitives.add).toHaveBeenCalledTimes(2);
    expect(addedSystems).toHaveLength(2);
  });
});

describe('PulseManager.setUtilisation', () => {
  it('updates emissionRate on the stored system', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    manager.build([FIXTURE]);

    const system = addedSystems[0] as MockParticleSystem;
    manager.setUtilisation('path-1', 0.8);

    expect(system.emissionRate).toBeCloseTo(4 * 0.8);
  });

  it('is a no-op for unknown PathId', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    manager.build([FIXTURE]);

    // Should not throw
    expect(() => manager.setUtilisation('no-such-path', 0.5)).not.toThrow();
  });
});

describe('PulseManager.destroy', () => {
  it('removes all particle systems from scene.primitives', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    manager.build([FIXTURE]);

    manager.destroy();

    expect(viewer.scene.primitives.remove).toHaveBeenCalledTimes(1);
    expect(removedSystems).toHaveLength(1);
    expect(removedSystems[0]).toBe(addedSystems[0]);
  });

  it('clears the internal map so a second destroy is safe', () => {
    const viewer = makeViewer();
    const manager = new PulseManager(viewer);
    manager.build([FIXTURE]);

    manager.destroy();
    removedSystems.length = 0;
    manager.destroy(); // second call — nothing to remove

    expect(viewer.scene.primitives.remove).toHaveBeenCalledTimes(1); // only the first call
  });
});
