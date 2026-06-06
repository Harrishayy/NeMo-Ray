import { MockSimulationSource } from '@/lib/cesium/signal/simulation/MockSimulationSource';
import type { SignalAlert, SimulationFrame } from '@/lib/cesium/signal/contract/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSource() {
  return new MockSimulationSource();
}

// ---------------------------------------------------------------------------
// getInitialPaths
// ---------------------------------------------------------------------------

describe('getInitialPaths', () => {
  it('returns exactly 7 paths', () => {
    const source = makeSource();
    const paths = source.getInitialPaths() as ReturnType<typeof source.getInitialPaths>;
    // getInitialPaths is synchronous in this implementation
    expect(Array.isArray(paths)).toBe(true);
    expect((paths as unknown[]).length).toBe(7);
  });

  it('all paths have siteId "canary-wharf"', () => {
    const source = makeSource();
    const paths = source.getInitialPaths() as ReturnType<typeof source.getInitialPaths>;
    for (const path of paths as { siteId: string }[]) {
      expect(path.siteId).toBe('canary-wharf');
    }
  });

  it('all paths have unique ids', () => {
    const source = makeSource();
    const paths = source.getInitialPaths() as { id: string }[];
    const ids = new Set(paths.map((p) => p.id));
    expect(ids.size).toBe(7);
  });

  it('does not expose internal _wave field', () => {
    const source = makeSource();
    const paths = source.getInitialPaths() as unknown as Record<string, unknown>[];
    for (const path of paths) {
      expect(path['_wave']).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// start / stop — timer behaviour
// ---------------------------------------------------------------------------

describe('start / stop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('onUpdate callback fires after start()', () => {
    const source = makeSource();
    const cb = jest.fn();
    source.onUpdate(cb);
    source.start();

    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(2);

    source.stop();
  });

  it('callback does NOT fire before start()', () => {
    const source = makeSource();
    const cb = jest.fn();
    source.onUpdate(cb);

    jest.advanceTimersByTime(2000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('stop() prevents further callbacks', () => {
    const source = makeSource();
    const cb = jest.fn();
    source.onUpdate(cb);
    source.start();

    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1);

    source.stop();
    jest.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(1); // no additional calls
  });

  it('start() is idempotent — calling twice does not create two intervals', () => {
    const source = makeSource();
    const cb = jest.fn();
    source.onUpdate(cb);
    source.start();
    source.start(); // second call should be a no-op

    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1); // exactly 1, not 2

    source.stop();
  });

  it('stop() is idempotent', () => {
    const source = makeSource();
    source.start();
    source.stop();
    expect(() => source.stop()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Unsubscribe
// ---------------------------------------------------------------------------

describe('onUpdate unsubscribe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('unsubscribe stops future callbacks', () => {
    const source = makeSource();
    const cb = jest.fn();
    const unsub = source.onUpdate(cb);
    source.start();

    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1); // frozen after unsub

    source.stop();
  });

  it('multiple subscribers are independent', () => {
    const source = makeSource();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const unsub1 = source.onUpdate(cb1);
    source.onUpdate(cb2);
    source.start();

    jest.advanceTimersByTime(500);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    unsub1();
    jest.advanceTimersByTime(500);
    expect(cb1).toHaveBeenCalledTimes(1); // no new call for cb1
    expect(cb2).toHaveBeenCalledTimes(2); // cb2 still receives

    source.stop();
  });
});

// ---------------------------------------------------------------------------
// Utilisation clamping
// ---------------------------------------------------------------------------

describe('utilisation clamping', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('all utilisation values are in [0, 1]', () => {
    const source = makeSource();
    const frames: SimulationFrame[] = [];
    source.onUpdate((f) => frames.push(f));
    source.start();

    // Advance enough ticks to accumulate many samples
    jest.advanceTimersByTime(500 * 50);
    source.stop();

    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      for (const val of Object.values(frame.utilisation)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('each frame contains all 7 path ids', () => {
    const source = makeSource();
    const initialPaths = source.getInitialPaths() as { id: string }[];
    const expectedIds = new Set(initialPaths.map((p) => p.id));

    let frame: SimulationFrame | null = null;
    source.onUpdate((f) => { frame = f; });
    source.start();

    jest.advanceTimersByTime(500);
    source.stop();

    expect(frame).not.toBeNull();
    const frameIds = new Set(Object.keys((frame as unknown as SimulationFrame).utilisation));
    expect(frameIds).toEqual(expectedIds);
  });
});

// ---------------------------------------------------------------------------
// triggerAlert
// ---------------------------------------------------------------------------

describe('triggerAlert', () => {
  it('fires registered alert callbacks immediately', () => {
    const source = makeSource();
    const alertCb = jest.fn();
    source.onAlert(alertCb);

    const alert: SignalAlert = {
      pathId: 'cw-north-01',
      severity: 'warning',
      message: 'High utilisation detected',
      durationMs: 3000,
    };

    source.triggerAlert(alert);
    expect(alertCb).toHaveBeenCalledTimes(1);
    expect(alertCb).toHaveBeenCalledWith(alert);
  });

  it('fires multiple alert subscribers', () => {
    const source = makeSource();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    source.onAlert(cb1);
    source.onAlert(cb2);

    const alert: SignalAlert = { severity: 'critical', message: 'Site down' };
    source.triggerAlert(alert);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribed alert callback is not called', () => {
    const source = makeSource();
    const cb = jest.fn();
    const unsub = source.onAlert(cb);
    unsub();

    source.triggerAlert({ severity: 'info', message: 'Test' });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onTopologyChange — stub (never fires)
// ---------------------------------------------------------------------------

describe('onTopologyChange', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers without throwing', () => {
    const source = makeSource();
    expect(() => {
      const unsub = source.onTopologyChange!(() => {});
      unsub();
    }).not.toThrow();
  });

  it('never fires topology callbacks (static mock)', () => {
    const source = makeSource();
    const cb = jest.fn();
    source.onTopologyChange!(cb);
    source.start();
    jest.advanceTimersByTime(5000);
    source.stop();
    expect(cb).not.toHaveBeenCalled();
  });
});
