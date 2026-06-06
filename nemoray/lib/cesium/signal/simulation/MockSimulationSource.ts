import type {
  SignalSimulationSource,
  SignalPath,
  SimulationFrame,
  SignalAlert,
  Unsubscribe,
} from '../contract/types';

// ---------------------------------------------------------------------------
// Static fixture — 7 paths radiating from Canary Wharf tower
// ---------------------------------------------------------------------------

const CANARY_WHARF: { lon: number; lat: number; height: number } = {
  lon: -0.0235,
  lat: 51.5055,
  height: 235, // approx tower height metres
};

/**
 * Per-path wave constants for utilisation animation.
 * freq  — cycles per second
 * phase — radians offset so each path is out of sync
 */
interface WaveParams {
  freq: number;
  phase: number;
}

interface PathFixture extends SignalPath {
  _wave: WaveParams;
}

const PATHS: PathFixture[] = [
  // North — Stratford / Hackney
  {
    id: 'cw-north-01',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: -0.0431, lat: 51.5472, height: 0 },
    bend: 0.15,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.18, phase: 0.0 },
  },
  // North-west — City of London / Bank
  {
    id: 'cw-northwest-02',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: -0.0897, lat: 51.5128, height: 0 },
    bend: 0.20,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.22, phase: 1.05 },
  },
  // West — Waterloo / Lambeth
  {
    id: 'cw-west-03',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: -0.1134, lat: 51.5025, height: 0 },
    bend: 0.18,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.15, phase: 2.09 },
  },
  // South-west — Greenwich / Lewisham
  {
    id: 'cw-southwest-04',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: -0.0090, lat: 51.4741, height: 0 },
    bend: 0.22,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.25, phase: 3.14 },
  },
  // South — Deptford / New Cross
  {
    id: 'cw-south-05',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: -0.0423, lat: 51.4679, height: 0 },
    bend: 0.17,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.20, phase: 4.19 },
  },
  // East — Barking / Beckton
  {
    id: 'cw-east-06',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: 0.0780, lat: 51.5093, height: 0 },
    bend: 0.25,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.12, phase: 5.24 },
  },
  // North-east — Leyton / Walthamstow
  {
    id: 'cw-northeast-07',
    siteId: 'canary-wharf',
    start: CANARY_WHARF,
    end: { lon: 0.0152, lat: 51.5670, height: 0 },
    bend: 0.19,
    archeight: 0,
    utilisation: 0.5,
    _wave: { freq: 0.16, phase: 0.52 },
  },
];

// ---------------------------------------------------------------------------
// MockSimulationSource
// ---------------------------------------------------------------------------

export class MockSimulationSource implements SignalSimulationSource {
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _startTime = 0;

  private _updateCallbacks: Set<(frame: SimulationFrame) => void> = new Set();
  private _topologyCallbacks: Set<(paths: SignalPath[]) => void> = new Set();
  private _alertCallbacks: Set<(alert: SignalAlert) => void> = new Set();

  // -------------------------------------------------------------------------
  // SignalSimulationSource — read
  // -------------------------------------------------------------------------

  getInitialPaths(): SignalPath[] {
    // Return plain SignalPath objects (strip internal _wave field)
    return PATHS.map(({ _wave, ...path }) => ({ ...path }));
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  start(): void {
    if (this._intervalId !== null) return; // idempotent
    this._startTime = Date.now();

    this._intervalId = setInterval(() => {
      const t = (Date.now() - this._startTime) / 1000; // elapsed seconds
      const utilisation: Record<string, number> = {};

      for (const path of PATHS) {
        const raw =
          0.5 +
          0.4 * Math.sin(t * path._wave.freq * 2 * Math.PI + path._wave.phase) +
          0.05 * Math.random();
        utilisation[path.id] = Math.min(1, Math.max(0, raw));
      }

      const frame: SimulationFrame = {
        timestamp: Date.now(),
        utilisation,
      };

      for (const cb of this._updateCallbacks) {
        cb(frame);
      }
    }, 500);
  }

  stop(): void {
    if (this._intervalId === null) return; // idempotent
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  // -------------------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------------------

  onUpdate(cb: (frame: SimulationFrame) => void): Unsubscribe {
    this._updateCallbacks.add(cb);
    return () => {
      this._updateCallbacks.delete(cb);
    };
  }

  /** Topology is static in the mock — registers but never fires. */
  onTopologyChange(cb: (paths: SignalPath[]) => void): Unsubscribe {
    this._topologyCallbacks.add(cb);
    return () => {
      this._topologyCallbacks.delete(cb);
    };
  }

  onAlert(cb: (alert: SignalAlert) => void): Unsubscribe {
    this._alertCallbacks.add(cb);
    return () => {
      this._alertCallbacks.delete(cb);
    };
  }

  // -------------------------------------------------------------------------
  // Demo helper — not part of the interface
  // -------------------------------------------------------------------------

  /** Fire all registered alert callbacks immediately. Used by demo UI. */
  triggerAlert(alert: SignalAlert): void {
    for (const cb of this._alertCallbacks) {
      cb(alert);
    }
  }
}
