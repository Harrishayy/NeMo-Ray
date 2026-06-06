import type {
  SignalSimulationSource,
  SimulationFrame,
  SignalPath,
  SignalAlert,
  Unsubscribe,
} from '../contract/types';

/**
 * Wraps a SimulationSource and throttles onUpdate callbacks to the given
 * maxFps rate (default 60). Useful if a fast simulation floods the render loop.
 *
 * All other SignalSimulationSource methods delegate directly to the wrapped
 * source.
 */
export class SimulationAdapter implements SignalSimulationSource {
  private _latestFrame: SimulationFrame | null = null;
  private _flushScheduled = false;
  private _updateCallbacks: Set<(frame: SimulationFrame) => void> = new Set();
  private _sourceUnsub: Unsubscribe | null = null;

  constructor(
    private readonly source: SignalSimulationSource,
    private readonly maxFps: number = 60,
  ) {}

  // -------------------------------------------------------------------------
  // Throttled onUpdate
  // -------------------------------------------------------------------------

  onUpdate(cb: (frame: SimulationFrame) => void): Unsubscribe {
    // Subscribe to the underlying source once (on first external subscriber).
    if (this._updateCallbacks.size === 0) {
      this._sourceUnsub = this.source.onUpdate((frame) => {
        this._latestFrame = frame;
        if (!this._flushScheduled) {
          this._flushScheduled = true;
          setTimeout(() => {
            this._flushScheduled = false;
            if (this._latestFrame !== null) {
              const frame = this._latestFrame;
              for (const listener of this._updateCallbacks) {
                listener(frame);
              }
            }
          }, Math.floor(1000 / this.maxFps));
        }
      });
    }

    this._updateCallbacks.add(cb);

    return () => {
      this._updateCallbacks.delete(cb);
      // Tear down the source subscription when nobody is listening.
      if (this._updateCallbacks.size === 0 && this._sourceUnsub) {
        this._sourceUnsub();
        this._sourceUnsub = null;
        this._flushScheduled = false;
        this._latestFrame = null;
      }
    };
  }

  // -------------------------------------------------------------------------
  // Pass-through delegates
  // -------------------------------------------------------------------------

  getInitialPaths(): Promise<SignalPath[]> | SignalPath[] {
    return this.source.getInitialPaths();
  }

  start(): void {
    this.source.start();
  }

  stop(): void {
    this.source.stop();
  }

  onTopologyChange(cb: (paths: SignalPath[]) => void): Unsubscribe {
    if (this.source.onTopologyChange) {
      return this.source.onTopologyChange(cb);
    }
    // Source doesn't support topology changes — return a no-op unsubscribe.
    return () => {};
  }

  onAlert(cb: (alert: SignalAlert) => void): Unsubscribe {
    if (this.source.onAlert) {
      return this.source.onAlert(cb);
    }
    return () => {};
  }
}
