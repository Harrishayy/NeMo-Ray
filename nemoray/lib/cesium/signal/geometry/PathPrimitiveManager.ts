import * as Cesium from 'cesium';
import type { SignalPath, PathId } from '../contract/types';
import { samplePath } from '../contract/pathMath';

// SCALE-HOOK: batch by site with per-vertex attribute — group paths by siteId into one
// Primitive per site, encoding per-path colour as a per-vertex vec4 attribute so the
// fragment shader can select the right ramp. For v1 we use one Primitive per path for
// correctness: PolylineMaterialAppearance only supports one Material per Primitive.

/**
 * Builds and manages Cesium Primitive objects for signal-path polylines.
 *
 * Lifecycle contract:
 *   build(paths)   — initial render; call once (or after a full topology reset).
 *   rebuild(paths) — incremental diff; only recreates primitives for changed paths.
 *   getMaterial(id) — returns the Material associated with the given PathId.
 *   destroy()      — removes all owned primitives and clears internal state.
 *
 * Design decisions (v1):
 *   - One Primitive per path, each backed by a single GeometryInstance.
 *   - The caller-supplied materialFactory is invoked once per path at build time.
 *   - Material references are stored in a Map for later uniform-only updates;
 *     utilisation changes MUST NOT trigger a rebuild — only mutate the material uniforms.
 *   - No per-frame heap allocation in hot paths.
 */
export class PathPrimitiveManager {
  /** Maps PathId → the Cesium.Primitive added to the scene. */
  private primitives = new Map<PathId, Cesium.Primitive>();
  /** Maps PathId → the Material returned by materialFactory at build time. */
  private materials = new Map<PathId, Cesium.Material>();
  /**
   * Topology fingerprint: a stable string derived from path geometry.
   * Used by rebuild() to detect whether a path's geometry has changed.
   * Only start/end/bend/archeight are included — utilisation is intentionally omitted.
   */
  private topology = new Map<PathId, string>();

  constructor(
    private viewer: Cesium.Viewer,
    private materialFactory: (p: SignalPath) => Cesium.Material,
  ) {}

  // ─── private helpers ────────────────────────────────────────────────────────

  /** Deterministic fingerprint of the geometry-relevant fields on a path. */
  private static fingerprint(p: SignalPath): string {
    return `${p.start.lon},${p.start.lat},${p.start.height ?? 0}|${p.end.lon},${p.end.lat},${p.end.height ?? 0}|${p.bend ?? 0.2}|${p.archeight ?? 0}`;
  }

  /** Build and register a single Primitive + Material for one path. */
  private buildOne(path: SignalPath): void {
    const material = this.materialFactory(path);
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        id: path.id,
        geometry: new Cesium.PolylineGeometry({
          positions: samplePath(path),
          width: 6.0,
          vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
        }),
      }),
      appearance: new Cesium.PolylineMaterialAppearance({
        material,
        translucent: true,
      }),
      // Disable asynchronous GPU upload so unit tests (which have no render loop)
      // can verify primitives were added without needing a frame tick.
      asynchronous: false,
    });

    this.viewer.scene.primitives.add(primitive);
    this.primitives.set(path.id, primitive);
    this.materials.set(path.id, material);
    this.topology.set(path.id, PathPrimitiveManager.fingerprint(path));
  }

  /** Remove the primitive for one path from the scene and internal maps. */
  private removeOne(id: PathId): void {
    const prim = this.primitives.get(id);
    if (prim !== undefined) {
      this.viewer.scene.primitives.remove(prim);
    }
    this.primitives.delete(id);
    this.materials.delete(id);
    this.topology.delete(id);
  }

  // ─── public API ─────────────────────────────────────────────────────────────

  /**
   * Initial build: add a Primitive for every path in `paths`.
   * Any previously owned primitives are destroyed first so build() is safe to
   * call more than once (e.g. after a full topology reset from the simulation).
   */
  build(paths: SignalPath[]): void {
    // Tear down any existing state before a full rebuild.
    this.destroy();

    for (const path of paths) {
      this.buildOne(path);
    }
  }

  /**
   * Incremental rebuild: diff `paths` against the current set.
   *
   * Rules:
   *   - New path (id not seen before) → build.
   *   - Existing path with changed topology (geometry fields) → remove + rebuild.
   *   - Existing path with same topology → keep (no redraw, uniforms unchanged).
   *   - Stale path (id no longer in `paths`) → remove.
   *
   * A utilisation change alone MUST NOT reach this function; it belongs in a
   * material-uniform update path, not here.
   */
  rebuild(paths: SignalPath[]): void {
    const incomingIds = new Set<PathId>(paths.map((p) => p.id));

    // Remove stale paths.
    for (const id of this.primitives.keys()) {
      if (!incomingIds.has(id)) {
        this.removeOne(id);
      }
    }

    // Add new paths or re-build those whose topology changed.
    for (const path of paths) {
      const existing = this.topology.get(path.id);
      const fp = PathPrimitiveManager.fingerprint(path);

      if (existing === undefined) {
        // Brand-new path.
        this.buildOne(path);
      } else if (existing !== fp) {
        // Topology changed (rerouted) — tear down and recreate.
        this.removeOne(path.id);
        this.buildOne(path);
      }
      // else: topology unchanged — leave primitive in place.
    }
  }

  /**
   * Returns the Material that was created for the given PathId, or undefined if
   * the path is not currently managed by this instance.
   *
   * Use this to perform uniform-only updates (e.g. colour ramp driven by a new
   * utilisation value) without triggering a geometry rebuild.
   */
  getMaterial(id: PathId): Cesium.Material | undefined {
    return this.materials.get(id);
  }

  /**
   * Remove all owned primitives from the scene and clear all internal state.
   * Safe to call multiple times.
   */
  destroy(): void {
    for (const prim of this.primitives.values()) {
      this.viewer.scene.primitives.remove(prim);
    }
    this.primitives.clear();
    this.materials.clear();
    this.topology.clear();
  }
}
