import * as Cesium from 'cesium';
import { PathPrimitiveManager } from '../geometry/PathPrimitiveManager';
import { createSignalMaterial, updateSignalUniforms } from '../material/signalMaterial';
import { PulseManager } from '../particles/PulseManager';
import { utilColorJS } from '../contract/colorRamp';
import type { SignalPathLayerOptions, SignalPathLayer as ISignalPathLayer } from '../contract/SignalPathLayer.types';
import type { PathId, SiteId, SignalPath, SignalAlert, SignalSimulationSource, Unsubscribe } from '../contract/types';

const DEFAULT_ALERT_DURATION_MS = 3000;

interface AlertState { duration: number; remaining: number; }

export class SignalPathLayer implements ISignalPathLayer {
  private readonly _viewer: Cesium.Viewer;
  private readonly _source: SignalSimulationSource;
  private readonly _showParticles: boolean;
  private readonly _primitiveManager: PathPrimitiveManager;
  private readonly _pulseManager: PulseManager;

  private _paths = new Map<PathId, SignalPath>();
  private _siteToPathIds = new Map<SiteId, Set<PathId>>();
  private _alertDecay = new Map<string, AlertState>();

  private _haloCollection: Cesium.PointPrimitiveCollection | null = null;
  private _haloBysite = new Map<SiteId, Cesium.PointPrimitive>();

  private _unsubUpdate?: Unsubscribe;
  private _unsubTopology?: Unsubscribe;
  private _unsubAlert?: Unsubscribe;
  private _preUpdateListener?: (scene: Cesium.Scene, time: Cesium.JulianDate) => void;
  private _lastPreUpdateMs?: number;

  constructor(options: SignalPathLayerOptions) {
    this._viewer = options.viewer;
    this._source = options.source;
    this._showParticles = options.showParticles ?? true;

    this._primitiveManager = new PathPrimitiveManager(
      this._viewer,
      (p) => createSignalMaterial({ utilisation: p.utilisation }),
    );
    this._pulseManager = new PulseManager(this._viewer);
  }

  // ─── public API ───────────────────────────────────────────────────────────

  start(): void {
    const pathsResult = this._source.getInitialPaths();
    const init = (paths: SignalPath[]) => {
      this._indexPaths(paths);
      this._primitiveManager.build(paths);
      if (this._showParticles) this._pulseManager.build(paths);
      this._buildHalos(paths);
    };

    if (pathsResult instanceof Promise) {
      pathsResult.then(init);
    } else {
      init(pathsResult);
    }

    // Per-frame: advance shader time + decay alert uniforms.
    this._preUpdateListener = () => {
      const now = performance.now();
      const dtMs = this._lastPreUpdateMs !== undefined ? now - this._lastPreUpdateMs : 16;
      this._lastPreUpdateMs = now;

      for (const path of this._paths.values()) {
        const mat = this._primitiveManager.getMaterial(path.id);
        if (mat) updateSignalUniforms(mat, dtMs / 1000);
      }
      this._tickAlertDecay(dtMs);
    };
    this._viewer.scene.preUpdate.addEventListener(this._preUpdateListener);

    // Wire simulation updates — only scalar changes, never geometry rebuilds.
    this._unsubUpdate = this._source.onUpdate((frame) => {
      for (const [pathId, util] of Object.entries(frame.utilisation)) {
        const mat = this._primitiveManager.getMaterial(pathId);
        if (mat) mat.uniforms.u_utilisation = util;
        if (this._showParticles) this._pulseManager.setUtilisation(pathId, util);
        const path = this._paths.get(pathId);
        if (path) {
          path.utilisation = util;
          this._refreshSiteHalo(path.siteId);
        }
      }
    });

    if (this._source.onTopologyChange) {
      this._unsubTopology = this._source.onTopologyChange((paths) => {
        this._indexPaths(paths);
        this._primitiveManager.rebuild(paths);
        if (this._showParticles) this._pulseManager.build(paths);
        this._buildHalos(paths);
      });
    }

    if (this._source.onAlert) {
      this._unsubAlert = this._source.onAlert((alert) => this._handleAlert(alert));
    }

    this._source.start();
  }

  stop(): void {
    this._source.stop();
    this._unsubUpdate?.();
    this._unsubTopology?.();
    this._unsubAlert?.();
    this._unsubUpdate = undefined;
    this._unsubTopology = undefined;
    this._unsubAlert = undefined;
    if (this._preUpdateListener) {
      this._viewer.scene.preUpdate.removeEventListener(this._preUpdateListener);
      this._preUpdateListener = undefined;
    }
    this._lastPreUpdateMs = undefined;
  }

  destroy(): void {
    this.stop();
    this._primitiveManager.destroy();
    this._pulseManager.destroy();
    if (this._haloCollection) {
      this._viewer.scene.primitives.remove(this._haloCollection);
      this._haloCollection = null;
    }
    this._haloBysite.clear();
    this._paths.clear();
    this._siteToPathIds.clear();
    this._alertDecay.clear();
  }

  setUtilisation(pathId: PathId, value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    const mat = this._primitiveManager.getMaterial(pathId);
    if (mat) mat.uniforms.u_utilisation = clamped;
    if (this._showParticles) this._pulseManager.setUtilisation(pathId, clamped);
  }

  triggerAlert(alert: SignalAlert): void {
    this._handleAlert(alert);
  }

  // ─── private helpers ──────────────────────────────────────────────────────

  private _indexPaths(paths: SignalPath[]): void {
    this._paths.clear();
    this._siteToPathIds.clear();
    for (const p of paths) {
      this._paths.set(p.id, { ...p });
      let ids = this._siteToPathIds.get(p.siteId);
      if (!ids) { ids = new Set(); this._siteToPathIds.set(p.siteId, ids); }
      ids.add(p.id);
    }
  }

  private _buildHalos(paths: SignalPath[]): void {
    if (this._haloCollection) {
      this._viewer.scene.primitives.remove(this._haloCollection);
    }
    this._haloBysite.clear();
    this._haloCollection = new Cesium.PointPrimitiveCollection();

    // One halo per unique site — position from the first path's start point.
    const seen = new Set<SiteId>();
    for (const p of paths) {
      if (seen.has(p.siteId)) continue;
      seen.add(p.siteId);

      const avgUtil = this._siteAvgUtil(p.siteId);
      const [r, g, b] = utilColorJS(avgUtil);
      const halo = this._haloCollection.add({
        position: Cesium.Cartesian3.fromDegrees(
          p.start.lon, p.start.lat, (p.start.height ?? 0) + 50,
        ),
        pixelSize: 18,
        color: new Cesium.Color(r, g, b, 0.9),
        outlineColor: new Cesium.Color(1, 1, 1, 0.4),
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(1e3, 1.5, 5e5, 0.5),
      });
      this._haloBysite.set(p.siteId, halo);
    }

    this._viewer.scene.primitives.add(this._haloCollection);
  }

  private _refreshSiteHalo(siteId: SiteId): void {
    const halo = this._haloBysite.get(siteId);
    if (!halo) return;
    const avgUtil = this._siteAvgUtil(siteId);
    const [r, g, b] = utilColorJS(avgUtil);
    halo.color = new Cesium.Color(r, g, b, 0.9);
  }

  private _siteAvgUtil(siteId: SiteId): number {
    const ids = this._siteToPathIds.get(siteId);
    if (!ids || ids.size === 0) return 0;
    let sum = 0;
    for (const id of ids) sum += this._paths.get(id)?.utilisation ?? 0;
    return sum / ids.size;
  }

  private _handleAlert(alert: SignalAlert): void {
    const duration = alert.durationMs ?? DEFAULT_ALERT_DURATION_MS;
    const state: AlertState = { duration, remaining: duration };

    if (alert.pathId) {
      const mat = this._primitiveManager.getMaterial(alert.pathId);
      if (mat) mat.uniforms.u_alert = 1.0;
      this._alertDecay.set(alert.pathId, { ...state });
    }

    if (alert.siteId) {
      const ids = this._siteToPathIds.get(alert.siteId);
      if (ids) {
        for (const id of ids) {
          const mat = this._primitiveManager.getMaterial(id);
          if (mat) mat.uniforms.u_alert = 1.0;
          this._alertDecay.set(id, { ...state });
        }
      }
      // Pulse the site halo orange.
      const halo = this._haloBysite.get(alert.siteId);
      if (halo) {
        halo.color = new Cesium.Color(1.0, 0.2, 0.0, 1.0);
        this._alertDecay.set(`site:${alert.siteId}`, { ...state });
      }
    }
  }

  private _tickAlertDecay(dtMs: number): void {
    for (const [key, state] of this._alertDecay.entries()) {
      state.remaining -= dtMs;
      const alpha = Math.max(0, state.remaining / state.duration);

      if (key.startsWith('site:')) {
        const siteId = key.slice(5);
        const halo = this._haloBysite.get(siteId);
        if (halo) {
          if (alpha <= 0) {
            this._refreshSiteHalo(siteId);
          } else {
            const [nr, ng, nb] = utilColorJS(this._siteAvgUtil(siteId));
            // Blend from normal colour toward alert orange as alpha → 1
            halo.color = new Cesium.Color(
              nr + (1.0 - nr) * alpha,
              ng + (0.2 - ng) * alpha,
              nb * (1 - alpha),
              0.9,
            );
          }
        }
      } else {
        const mat = this._primitiveManager.getMaterial(key);
        if (mat) mat.uniforms.u_alert = alpha;
      }

      if (state.remaining <= 0) this._alertDecay.delete(key);
    }
  }
}
