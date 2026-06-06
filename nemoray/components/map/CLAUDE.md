# components/map/ — the swappable map surface

The map is a **swappable surface behind one stable contract.** Read `README.md` here for
the full contract, and `../../docs/INVARIANTS.md` for the locks. Key rules:

- **Only `MapMount.tsx` reads the Zustand store.** It assembles `MapSurfaceProps`
  (`../../lib/types.ts`) and passes **props only** to the chosen surface. Surface impls
  (`CesiumScene`, `MapPlaceholder`) must **never import the store** — doing so
  breaks the swap. 🔒
- The active surface is chosen by **`NEXT_PUBLIC_MAP_IMPL`** (`placeholder` default |
  `cesium`). The live demo stack is **CesiumJS + Google Photorealistic 3D Tiles**.
- **Do not re-enable React StrictMode** (`next.config.ts`) — it kills Cesium's WebGL context. 🔒
- **Blank map?** Almost always missing `public/cesium/` assets → run `pnpm predev`/`prebuild`.
  It's an env step, not a code bug. 🔒

Editing the Cesium scene (effects, post-process, camera, beams, arcs)? Use the
`edit-cesium-scene` skill — it encodes the order-sensitive post-process stack and the
common failure modes.
