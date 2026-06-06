// FALLBACK: shader-dot — switch PulseManager out for shader-only pulse in material/
// if per-path ParticleSystem count causes frame-time issues (decide in Phase 2).

import * as Cesium from 'cesium';
import type { SignalPath, PathId } from '../contract/types';
import { samplePath, interpAlong } from '../contract/pathMath';
import { utilColorJS } from '../contract/colorRamp';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Drawn once per manager instance; reused across all particle systems. */
let _sharedGlowCanvas: HTMLCanvasElement | undefined;

/**
 * Returns a 64×64 radial-gradient white dot canvas, drawn once and cached.
 * Centre: white opaque → edge: white fully transparent.
 */
function glowDotCanvas(): HTMLCanvasElement {
  if (_sharedGlowCanvas) return _sharedGlowCanvas;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  _sharedGlowCanvas = canvas;
  return canvas;
}

/**
 * Convert utilColorJS [r,g,b] result to a Cesium.Color.
 * Alpha is always 1.0 here; startColor / endColor handle transparency.
 */
function utilColorCesium(u: number): Cesium.Color {
  const [r, g, b] = utilColorJS(u);
  return new Cesium.Color(r, g, b, 1.0);
}

// --------------------------------------------------------------------------
// PulseManager
// --------------------------------------------------------------------------

interface PathState {
  system: Cesium.ParticleSystem;
  pts: Cesium.Cartesian3[];
}

export class PulseManager {
  private _map = new Map<PathId, PathState>();

  constructor(private viewer: Cesium.Viewer) {}

  /**
   * Build one ParticleSystem per SignalPath and add it to scene.primitives.
   * Each system uses IDENTITY model-matrix so particle positions are in world
   * (ECEF) coordinates written directly by the updateCallback.
   */
  build(paths: SignalPath[]): void {
    for (const path of paths) {
      const pts = samplePath(path);
      const util = path.utilisation;

      // Dot size: 12 px at low utilisation, up to 20 px at saturation.
      const dotPx = 12 + 8 * util;
      const imageSize = new Cesium.Cartesian2(dotPx, dotPx);

      // NOTE: Cesium.Particle.normalizedAge is confirmed present in 1.142.0
      // (Cesium.d.ts line 41161). No fallback needed.
      const follow: Cesium.ParticleSystem.updateCallback = (
        particle: Cesium.Particle,
        _dt: number,
      ) => {
        const f = particle.normalizedAge; // 0..1 over lifetime
        // SCALE-HOOK: pool Cartesian3 to avoid per-frame allocation in v2
        particle.position = interpAlong(pts, f);
      };

      const system = new Cesium.ParticleSystem({
        image: glowDotCanvas(),
        startColor: new Cesium.Color(1, 1, 1, 1),
        endColor: utilColorCesium(util).withAlpha(0.0),
        emissionRate: 4 * util,
        particleLife: 2.0,
        loop: true,
        // NOTE: Cesium 1.142.0 has no PointEmitter — CircleEmitter(0) is equivalent
        // (zero-radius circle = single emission point). Position is overridden anyway.
        emitter: new Cesium.CircleEmitter(0.0),
        modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
        imageSize,
        updateCallback: follow,
      });

      this.viewer.scene.primitives.add(system);
      this._map.set(path.id, { system, pts });
    }
  }

  /**
   * Live-update a path's particle system to reflect a new utilisation value.
   * Updates emissionRate, start/end colour, and imageSize to match u.
   */
  setUtilisation(id: PathId, u: number): void {
    const state = this._map.get(id);
    if (!state) return;

    const { system } = state;
    system.emissionRate = 4 * u;
    system.startColor = new Cesium.Color(1, 1, 1, 1);
    system.endColor = utilColorCesium(u).withAlpha(0.0);

    const dotPx = 12 + 8 * u;
    system.minimumImageSize = new Cesium.Cartesian2(dotPx, dotPx);
    system.maximumImageSize = new Cesium.Cartesian2(dotPx, dotPx);
  }

  /**
   * Remove all particle systems from scene.primitives and clear internal state.
   * Safe to call multiple times.
   */
  destroy(): void {
    for (const { system } of this._map.values()) {
      this.viewer.scene.primitives.remove(system);
    }
    this._map.clear();
  }
}
