---
name: edit-cesium-scene
description: >-
  Safely edit the NeMo-Ray CesiumJS map (the nemoray/ HUD's 3D globe): viewer config, night
  scene effects, post-processing shaders, camera flights, mast beams, signal arcs, coverage
  volumes, or Google 3D tiles. Use when touching anything under components/cesium/ or
  lib/cesium/. Encodes the order-sensitive post-process stack and the common "blank map" /
  WebGL-crash failure modes so a fix doesn't corrupt the map.
---

# Edit the Cesium scene

The Cesium map is load-bearing and has several non-obvious failure modes. Read
`nemoray/docs/INVARIANTS.md` and `nemoray/components/map/README.md` before structural changes.

## Where things live
- **Viewer instantiation** → `components/cesium/CesiumViewer.tsx` (the only `Cesium.Viewer`;
  sets `window.CESIUM_BASE_URL`, WebGL2→WebGL1 fallback). Viewer is shared via `CesiumContext`.
- **Night scene** (background, light, bloom, fog, hidden sun/moon) → `lib/cesium/sceneEffects.ts`.
- **Camera** (London position, flights) → `lib/cesium/viewerConfig.ts` +
  `lib/cesium/camera/CesiumCameraController.ts`.
- **Layers** → `components/cesium/` (`PhotorealisticTiles`, `CoverageVolume`, `MastBeams`,
  `SignalArcs`, `CesiumPostProcess`). Geometry factories → `lib/cesium/primitives/`.
- **Data shapes** → `types/coverage.ts` (`CoveragePoint`, `MastSite`, …) — _not_ `lib/types.ts`.

## Rules (🔒 = locked invariant)
1. **🔒 Don't re-enable `reactStrictMode`** in `next.config.ts`. Cesium's WebGL context can't
   survive StrictMode's double-mount → "initialization failed". If you see a lint nudge to
   enable it, ignore it.
2. **🔒 Post-process order is load-bearing:** in `CesiumPostProcess.tsx` the stages stack
   **vignette → specular flare → lens ghosts**. Don't reorder. Keep bloom/brightness
   thresholds conservative — too aggressive crashes GL (`GL_GUILTY_CONTEXT_RESET`) on some
   NVIDIA/Linux drivers. Stages must be removed on unmount.
3. **🔒 Blank map ⇒ run `pnpm predev` / `pnpm prebuild`** (the `cpx` copy of Cesium assets to
   the gitignored `public/cesium/`). It's an env step, **not** a code bug — don't patch around it.
4. **Map surface components stay props-only** — don't import the Zustand store inside a Cesium
   layer/scene; that breaks the swap seam. `MapMount.tsx` is the only store reader.
5. **Brand colours** for GL materials (e.g. active beam `#00ffc3`, inactive `#ff4444`) live in
   the Cesium components as raw hex on purpose (these files are exempt from the token lint).
   Keep the green family aligned with `--color-nv` where it represents brand, not signal.

## Test
- Run with the Cesium surface: set `NEXT_PUBLIC_MAP_IMPL=cesium` and `pnpm dev`.
- Confirm the globe initialises (no "initialization failed"), tiles load, and post-process
  doesn't flicker/crash. Test on the target GPU when changing shader thresholds.
