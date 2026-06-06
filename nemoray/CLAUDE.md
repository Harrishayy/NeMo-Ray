@AGENTS.md

# nemoray (Next.js app)

The interactive HUD for NeMo-Ray — an "NVIDIA-grade mission control" digital twin
of UK ESN coverage. Dense, dark, instrument-like.

## Stack (the real one — verify against code, not memory)

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict** · **Tailwind CSS v4**
- **State: Zustand** (`store/index.ts`) with selector hooks — _not_ React context, _not_ Redux.
  Persisted panel state hydrates in `app/providers.tsx`.
- **Map: CesiumJS** (Google Photorealistic 3D Tiles) behind a swappable seam — chosen by
  `NEXT_PUBLIC_MAP_IMPL` (`placeholder` default | `cesium` | `deck`). `maplibre-gl`,
  `react-map-gl` and `deck.gl` are also in `package.json` as _alternate_ surfaces —
  **their presence ≠ the active impl.** Check the env var / `components/map/MapMount.tsx`.
- Package manager: **pnpm** (workspace + lockfile local to this directory) — use `pnpm add`.

## Commands

```bash
pnpm install
pnpm dev        # dev server (predev copies Cesium assets → public/cesium)
pnpm build      # production build (prebuild copies Cesium assets)
pnpm start      # serve the production build
pnpm lint
pnpm test
```

## Before editing the UI, read these

- **`docs/DESIGN-SYSTEM.md`** — the design language (tokens, HUD utilities, primitives,
  layout). The single source of truth for _how the UI looks_.
- **`docs/INVARIANTS.md`** — the small set of **locked** architectural invariants
  (no StrictMode, the map seam, Cesium asset copy, post-process order, Zustand backbone).
  Read before any structural / map / config change. Each lock has a _why_; change one only
  with explicit intent.
- `components/map/README.md` — the swappable map-surface contract (`MapSurfaceProps`).

## Precedence — code defines, docs describe

The **code is canonical**: `app/globals.css` `@theme` (design tokens),
`lib/geo/color.ts` (signal ramp), `lib/types.ts` (`MapSurfaceProps` data contract),
`next.config.ts` (build invariants). Docs and this file _describe_ that code — they must
**never hold a second copy** of a token value or type definition. If a doc and the code
disagree, **the code wins and the doc is the bug** — fix the doc. (This rule exists because
the old map section here drifted out of sync and misled collaborators.)

## Useful constants

- London bounding box: `[[-0.510, 51.286], [0.334, 51.686]]`.
- EE MNCs for OpenCellID filter: `20, 30` (UK EE).

## Conventions

- `DO NOT` install packages without adding them to `package.json`.
- Commits authored as a single human — no AI `Co-Authored-By` trailers (see root `CLAUDE.md`).
