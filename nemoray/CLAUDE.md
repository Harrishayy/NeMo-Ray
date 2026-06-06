@AGENTS.md

# nemoray (Next.js app)

> Scaffold — populate as the app takes shape.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · ESLint
- Package manager: **pnpm** (workspace + lockfile are local to this directory)

## Commands

```bash
pnpm install
pnpm dev        # dev server (Turbopack)
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint
```

## Layout

- `app/` — routes, layouts, and pages (App Router)
- `public/` — static assets

## NeMo-Ray map implementation context

Stack: Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4.
Map: MapLibre GL JS via react-map-gl. 3D layers: deck.gl with MapLibre interop.
State: React context only — no Redux, no Zustand yet.
Data: All coverage/mast data comes through types defined in types/coverage.ts.
Tile style: use MapTiler free style URL (env var NEXT_PUBLIC_MAPTILER_KEY).
London bounding box: [[-0.510, 51.286], [0.334, 51.686]].
EE MNCs for OpenCellID filter: 20, 30 (UK EE).

Package manager: **pnpm** — always use `pnpm add` not `npm install`.
Run builds with: `pnpm build` from within the `nemoray/` directory.

DO NOT modify files outside your assigned ownership list.
DO NOT install packages without adding them to package.json.
Commit message prefix: feat(map):

## Notes

<!-- Routing decisions, data-fetching patterns, server vs client components,
     environment variables, deployment target, etc. -->
