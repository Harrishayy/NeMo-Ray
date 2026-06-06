# NeMo-Ray UI — Invariants

A short, deliberately small list of decisions that are **load-bearing**: each one already
cost a bug or breaks the demo when "cleaned up" by someone who didn't know why it was there.
This file exists so a collaborator (human or AI) can edit the UI confidently **without**
deleting core methodology by accident.

## How to read the tiers

- **🔒 LOCKED INVARIANT** — Change only with **explicit human intent and a stated reason.**
  If your task genuinely _requires_ changing one, say so out loud, explain the trade-off,
  and confirm before editing. These are protected, **not frozen** — they have an escape
  hatch, but the escape hatch is "be deliberate," not "silently refactor."
- **CONVENTION** — The house style. Follow it for consistency; deviate only with a reason.
- **FREE TO IMPROVE** — Everything else. `../../CONTRIBUTING.md` applies: a named tool is a
  starting point — swap in something better.

`CONTRIBUTING.md`'s "docs are a direction, not a contract" stance governs **product and
tooling** choices. **This file governs the narrow set of code-level locks** — don't cite
CONTRIBUTING.md to justify flipping one of these.

---

## 🔒 LOCKED INVARIANTS

### 1. `next.config.ts` — `reactStrictMode: false`
**Why:** CesiumJS creates a WebGL context the browser can't release fast enough for React
StrictMode's mount→unmount→remount cycle, causing "initialization failed" and a dead map.
Don't "fix" a lint/warning by flipping it on. (The reason is also commented inline in the file.)

### 2. The map seam — only `MapMount.tsx` reads the store
**Why:** `components/map/MapMount.tsx` is the **single** component that touches the Zustand
store; it assembles `MapSurfaceProps` (defined in `lib/types.ts`) and passes **props only**
to a swappable surface chosen by `NEXT_PUBLIC_MAP_IMPL` (`placeholder` | `cesium`).
A surface implementation that imports the store directly breaks the placeholder↔cesium swap.
See `components/map/README.md` for the contract. (A third `deck.gl`/MapLibre surface was
retired — superseded by Cesium — so the seam is now placeholder|cesium only.)

### 3. Cesium asset copy — `pnpm predev` / `prebuild` → `public/cesium/`
**Why:** `public/cesium/` is gitignored; the `predev`/`prebuild` scripts `cpx`-copy Cesium's
`Assets/Widgets/Workers/ThirdParty` into it. Without that copy the map renders **blank**
("Cesium is not defined"). A blank map is almost always this — an **env/build step, not a
code bug.** Run the script; don't patch around it in code.

### 4. `CesiumPostProcess` shader order — vignette → specular flare → lens ghosts
**Why:** The three post-process stages in `components/cesium/CesiumPostProcess.tsx` are
stacked in this order on purpose. Reordering them, or pushing the bloom/brightness
thresholds too aggressively, can crash the GL context (`GL_GUILTY_CONTEXT_RESET`) on some
NVIDIA/Linux drivers. Change thresholds conservatively and test on the target hardware.

### 5. State backbone is Zustand (`store/index.ts`) with selector hooks
**Why:** The app is built on a single Zustand store with selector hooks (`useKpis`,
`useSites`, `usePanels`, …) — **not** React context, **not** Redux. Persisted panel state
hydrates in `app/providers.tsx` after mount (so SSR markup matches the default). New shared
UI state belongs in the store with a selector hook. Re-introducing React context for shared
state, or moving the hydration, causes panel flicker and re-render storms.

---

## Two parallel type worlds (a known confusion — document, don't "unify" casually)

There are **two** type modules, and both define a `Proposal` and a `RadioMap` with
**different shapes**. This is intentional, and conflating them is a classic hallucination:

- **`lib/types.ts`** — the **store ↔ map-seam contract**: `MapSurfaceProps`, `Site`,
  `RadioMap`, `LayerState`, `CoverageStatus`, `RGB`, `CoverageLevel`. This is what
  `MapMount` and the store speak.
- **`types/coverage.ts`** — the **raw 3D-layer + mock-data shapes**: `CoveragePoint`,
  `MastSite`, `DeadZone`, plus its own `Proposal`/`RadioMap`. Imported by the Cesium layers
  (`MastBeams`, `SignalArcs`, `CoverageVolume`) and `lib/data/mock*`.

**Pick by context:** store/seam work → `lib/types.ts`; raw Cesium layer geometry &
mock generators → `types/coverage.ts`. Don't assume one is dead and delete it — grep first.
(CONVENTION: a future consolidation is welcome, but it's a deliberate refactor, not a cleanup.)

---

## CONVENTIONS (house style)

- **Compose from `components/primitives/`** — don't hand-roll panels/buttons/readouts.
- **Use design tokens** (`bg-panel`, `text-nv`, `var(--radius-hud)`) — never hardcode HUD
  hex/radius in DOM chrome (lint-enforced; see `DESIGN-SYSTEM.md` §6).
- **Merge classes through `lib/cn.ts`** (`cn()`).
- **Keep the `prefers-reduced-motion` guard** when adding animations.
- **Conventional Commits**, single human author (no AI co-author trailers).

## FREE TO IMPROVE

Component internals, new panels/workspaces, mock data, copy, the choice of map surface to
ship (`placeholder`/`cesium`/`deck`), and almost everything not listed above. Make it better.
