import type { SignalPath, SignalSimulationSource, SimulationFrame, SignalAlert, Unsubscribe } from '@/lib/cesium/signal/contract/types';

// ---------------------------------------------------------------------------
// Captured mock instances — set by mock constructors via closure
// ---------------------------------------------------------------------------

let capturedPM: {
  build: jest.Mock; rebuild: jest.Mock;
  getMaterial: jest.Mock; destroy: jest.Mock;
};
let capturedPulse: {
  build: jest.Mock; setUtilisation: jest.Mock; destroy: jest.Mock;
};

// ---------------------------------------------------------------------------
// Cesium stubs
// ---------------------------------------------------------------------------

const _addedPrimitives: unknown[] = [];
const mockPreUpdate = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
const mockScene = {
  primitives: {
    add: jest.fn((p) => { _addedPrimitives.push(p); return p; }),
    remove: jest.fn((p) => {
      const i = _addedPrimitives.indexOf(p); if (i >= 0) _addedPrimitives.splice(i, 1);
    }),
    contains: jest.fn(() => false),
    destroyPrimitives: false,
  },
  preUpdate: mockPreUpdate,
};

jest.mock('cesium', () => ({
  Primitive: jest.fn(() => ({})),
  GeometryInstance: jest.fn(() => ({})),
  PolylineGeometry: jest.fn(() => ({})),
  PolylineMaterialAppearance: jest.fn(() => ({ VERTEX_FORMAT: {} })),
  Material: jest.fn(({ fabric }: { fabric: { uniforms: Record<string, unknown> } }) => ({
    uniforms: { ...fabric.uniforms },
  })),
  PointPrimitiveCollection: jest.fn(() => ({
    add: jest.fn(() => {
      const halo = { _color: null as unknown };
      Object.defineProperty(halo, 'color', {
        get() { return this._color; },
        set(v) { this._color = v; },
        enumerable: true, configurable: true,
      });
      return halo;
    }),
    remove: jest.fn(),
  })),
  Color: jest.fn((r: number, g: number, b: number, a: number) => ({ r, g, b, a })),
  Cartesian3: {
    fromDegrees: jest.fn(() => ({ x: 1, y: 2, z: 3 })),
    distance: jest.fn(() => 10000),
    subtract: jest.fn((_a: unknown, _b: unknown, out: Record<string, number>) => { out.x = 1; out.y = 0; out.z = 0; return out; }),
    cross: jest.fn((_a: unknown, _b: unknown, out: Record<string, number>) => { out.x = 0; out.y = 1; out.z = 0; return out; }),
    normalize: jest.fn((_v: unknown, out: Record<string, number>) => { out.x = 0; out.y = 1; out.z = 0; return out; }),
    midpoint: jest.fn((_a: unknown, _b: unknown, out: Record<string, number>) => { out.x = 1; out.y = 1; out.z = 1; return out; }),
    magnitude: jest.fn(() => 6371000),
    multiplyByScalar: jest.fn((_v: unknown, _s: number, out: Record<string, number>) => { out.x = 0; out.y = 0; out.z = 0; return out; }),
    add: jest.fn((_a: unknown, _b: unknown, out: Record<string, number>) => { out.x = 1; out.y = 1; out.z = 1; return out; }),
    clone: jest.fn((v: unknown) => ({ ...(v as object) })),
  },
  Matrix4: { IDENTITY: { clone: jest.fn(() => ({})) } },
  CircleEmitter: jest.fn(() => ({})),
  NearFarScalar: jest.fn(() => ({})),
  ParticleSystem: jest.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Sub-module mocks — mutate `this` so mock.instances works correctly
// ---------------------------------------------------------------------------

jest.mock('@/lib/cesium/signal/geometry/PathPrimitiveManager', () => ({
  PathPrimitiveManager: jest.fn(function (this: typeof capturedPM) {
    capturedPM = {
      build: jest.fn(),
      rebuild: jest.fn(),
      getMaterial: jest.fn((_id: string) => ({
        uniforms: { u_time: 0, u_utilisation: 0.3, u_alert: 0 },
      })),
      destroy: jest.fn(),
    };
    Object.assign(this, capturedPM);
  }),
}));

jest.mock('@/lib/cesium/signal/material/signalMaterial', () => ({
  createSignalMaterial: jest.fn((opts?: { utilisation?: number }) => ({
    uniforms: { u_time: 0, u_utilisation: opts?.utilisation ?? 0.3, u_alert: 0 },
  })),
  updateSignalUniforms: jest.fn((m: { uniforms: { u_time: number } }, dt: number) => {
    m.uniforms.u_time += dt;
  }),
}));

jest.mock('@/lib/cesium/signal/particles/PulseManager', () => ({
  PulseManager: jest.fn(function (this: typeof capturedPulse) {
    capturedPulse = {
      build: jest.fn(),
      setUtilisation: jest.fn(),
      destroy: jest.fn(),
    };
    Object.assign(this, capturedPulse);
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockViewer() {
  return { scene: mockScene } as unknown as import('cesium').Viewer;
}

function makeSource(): SignalSimulationSource & {
  _updateCb?: (f: SimulationFrame) => void;
  _alertCb?: (a: SignalAlert) => void;
} {
  const src: ReturnType<typeof makeSource> = {
    getInitialPaths: jest.fn(() => FIXTURE_PATHS),
    onUpdate:           jest.fn((cb) => { src._updateCb = cb; return () => { src._updateCb = undefined; }; }),
    onTopologyChange:   jest.fn(() => () => {}),
    onAlert:            jest.fn((cb) => { src._alertCb = cb; return () => { src._alertCb = undefined; }; }),
    start:  jest.fn(),
    stop:   jest.fn(),
  };
  return src;
}

const FIXTURE_PATHS: SignalPath[] = [
  { id: 'p1', siteId: 'site-a', start: { lon: -0.02, lat: 51.5 }, end: { lon: -0.10, lat: 51.55 }, utilisation: 0.5 },
  { id: 'p2', siteId: 'site-a', start: { lon: -0.02, lat: 51.5 }, end: { lon: -0.15, lat: 51.48 }, utilisation: 0.3 },
  { id: 'p3', siteId: 'site-b', start: { lon: -0.05, lat: 51.52 }, end: { lon: -0.20, lat: 51.56 }, utilisation: 0.7 },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { SignalPathLayer } from '@/lib/cesium/signal/core/SignalPathLayer';

beforeEach(() => {
  jest.clearAllMocks();
  _addedPrimitives.length = 0;
});

describe('SignalPathLayer — start()', () => {
  it('calls source.getInitialPaths and builds geometry', () => {
    const viewer = makeMockViewer();
    const src = makeSource();
    const layer = new SignalPathLayer({ viewer, source: src });
    layer.start();

    expect(src.getInitialPaths).toHaveBeenCalled();
    expect(capturedPM.build).toHaveBeenCalledWith(FIXTURE_PATHS);
  });

  it('builds particle systems by default', () => {
    const viewer = makeMockViewer();
    new SignalPathLayer({ viewer, source: makeSource() }).start();
    expect(capturedPulse.build).toHaveBeenCalledWith(FIXTURE_PATHS);
  });

  it('registers a preUpdate listener', () => {
    const viewer = makeMockViewer();
    new SignalPathLayer({ viewer, source: makeSource() }).start();
    expect(mockPreUpdate.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('subscribes to onUpdate and onAlert', () => {
    const viewer = makeMockViewer();
    const src = makeSource();
    new SignalPathLayer({ viewer, source: src }).start();
    expect(src.onUpdate).toHaveBeenCalled();
    expect(src.onAlert).toHaveBeenCalled();
  });

  it('calls source.start()', () => {
    const viewer = makeMockViewer();
    const src = makeSource();
    new SignalPathLayer({ viewer, source: src }).start();
    expect(src.start).toHaveBeenCalled();
  });
});

describe('SignalPathLayer — stop()', () => {
  it('calls source.stop() and removes preUpdate listener', () => {
    const viewer = makeMockViewer();
    const src = makeSource();
    const layer = new SignalPathLayer({ viewer, source: src });
    layer.start();
    layer.stop();
    expect(src.stop).toHaveBeenCalled();
    expect(mockPreUpdate.removeEventListener).toHaveBeenCalled();
  });
});

describe('SignalPathLayer — destroy()', () => {
  it('destroys geometry, particles, and halo collection', () => {
    const viewer = makeMockViewer();
    const layer = new SignalPathLayer({ viewer, source: makeSource() });
    layer.start();
    layer.destroy();
    expect(capturedPM.destroy).toHaveBeenCalled();
    expect(capturedPulse.destroy).toHaveBeenCalled();
  });
});

describe('SignalPathLayer — setUtilisation()', () => {
  it('updates material uniform and particles, never rebuilds geometry', () => {
    const viewer = makeMockViewer();
    const mockMat = { uniforms: { u_time: 0, u_utilisation: 0.3, u_alert: 0 } };
    const layer = new SignalPathLayer({ viewer, source: makeSource() });
    layer.start();

    // Override getMaterial to return a trackable mat
    capturedPM.getMaterial.mockReturnValue(mockMat);

    layer.setUtilisation('p1', 0.9);

    expect(capturedPM.getMaterial).toHaveBeenCalledWith('p1');
    expect(mockMat.uniforms.u_utilisation).toBeCloseTo(0.9);
    expect(capturedPulse.setUtilisation).toHaveBeenCalledWith('p1', 0.9);
    expect(capturedPM.rebuild).not.toHaveBeenCalled();
  });

  it('clamps value to [0, 1]', () => {
    const viewer = makeMockViewer();
    const mockMat = { uniforms: { u_time: 0, u_utilisation: 0.3, u_alert: 0 } };
    const layer = new SignalPathLayer({ viewer, source: makeSource() });
    layer.start();
    capturedPM.getMaterial.mockReturnValue(mockMat);

    layer.setUtilisation('p1', 1.5);
    expect(mockMat.uniforms.u_utilisation).toBe(1.0);

    layer.setUtilisation('p1', -0.5);
    expect(mockMat.uniforms.u_utilisation).toBe(0.0);
  });
});

describe('SignalPathLayer — onUpdate frame handling', () => {
  it('updates material uniforms from simulation frame without rebuilding geometry', () => {
    const viewer = makeMockViewer();
    const src = makeSource();
    const layer = new SignalPathLayer({ viewer, source: src });
    layer.start();

    const frame: SimulationFrame = { timestamp: Date.now(), utilisation: { p1: 0.8, p2: 0.2 } };
    src._updateCb?.(frame);

    expect(capturedPM.getMaterial).toHaveBeenCalledWith('p1');
    expect(capturedPM.getMaterial).toHaveBeenCalledWith('p2');
    expect(capturedPM.rebuild).not.toHaveBeenCalled();
  });
});

describe('SignalPathLayer — triggerAlert()', () => {
  it('sets u_alert=1 on the affected path material', () => {
    const viewer = makeMockViewer();
    const layer = new SignalPathLayer({ viewer, source: makeSource() });
    layer.start();

    const mockMat = { uniforms: { u_time: 0, u_utilisation: 0.5, u_alert: 0 } };
    capturedPM.getMaterial.mockReturnValue(mockMat);

    layer.triggerAlert({ pathId: 'p1', severity: 'critical', message: 'Test', durationMs: 1000 });
    expect(mockMat.uniforms.u_alert).toBe(1.0);
  });
});

describe('SignalPathLayer — showParticles option', () => {
  it('skips particle build when showParticles=false', () => {
    const viewer = makeMockViewer();
    new SignalPathLayer({ viewer, source: makeSource(), showParticles: false }).start();
    expect(capturedPulse.build).not.toHaveBeenCalled();
  });
});
