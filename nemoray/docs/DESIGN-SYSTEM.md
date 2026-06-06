# NeMo-Ray Design System

The HUD's visual language: **NVIDIA-grade dense mission control.** Near-black surfaces,
NVIDIA green `#76B900`, sharp 2px corners, Saira + JetBrains Mono telemetry. This document
**describes** the design system; it is not the source of the values.

> ## Precedence — read this first
> The **code defines, this doc describes.** Canonical sources:
> - **Design tokens** → `app/globals.css` `@theme` block.
> - **Signal/coverage colour ramp** → `lib/geo/color.ts` (`SIGNAL_STOPS`, `rampRGB`, `signalGradientCss`).
> - **Data contract** → `lib/types.ts` (`MapSurfaceProps`, `Site`, `RadioMap`, …).
>
> This doc **must never paste a second copy** of a token value or a type. If it disagrees
> with the code, **the code wins and this doc is the bug** — fix the doc. The reason this
> rule exists: a stale duplicate of the stack/tokens in `CLAUDE.md` once misled
> collaborators into building the wrong thing. Don't recreate that.

When you change the look of the UI, prefer the **`change-design-tokens`** skill — it walks
the gotchas (e.g. the ramp is mirrored in two places).

---

## 1. Design tokens

All tokens are defined **once** in `app/globals.css` under `@theme`, which makes them
available as Tailwind utilities (`bg-panel`, `text-nv`, `border-hairline`, …) **and** as
CSS variables (`var(--color-nv)`). **Reference tokens — never hardcode the raw hex/px**
in DOM components. (An ESLint rule enforces this for the HUD chrome; see §6.)

Token families (see `globals.css` for exact values):

| Family | Tokens | Purpose |
| --- | --- | --- |
| Surfaces | `--color-bg`, `--color-bg-2`, `--color-panel`, `--color-panel-2`, `--color-surface`, `--color-elevated` | Layered near-black backgrounds (darkest → most elevated). |
| Lines | `--color-hairline`, `--color-hairline-strong`, `--color-grid` | Translucent green hairlines + grid. |
| Brand | `--color-nv`, `--color-nv-bright`, `--color-nv-dim`, `--color-nv-glow` | NVIDIA green and its glow. |
| Text | `--color-ink`, `--color-ink-dim`, `--color-ink-faint` | Foreground greys, brightest → faintest. |
| Status | `--color-nominal`, `--color-warning`, `--color-critical`, `--color-info` | Semantic state colours. |
| Signal ramp | `--color-sig-critical` … `--color-sig-excellent` | **Mirror** of `lib/geo/color.ts`. |
| Type | `--font-sans` (Saira), `--font-display` (Saira), `--font-mono` (JetBrains Mono) | Loaded in `app/layout.tsx`. |
| Radius | `--radius-hud` (2px) | Sharp, instrument-like — _not_ rounded. |

**Brand-locked values** — changing these is a deliberate re-brand, not a tweak: NVIDIA
green `--color-nv`, the near-black surface ramp, and the sharp `--radius-hud`. Surface such
a change to a human before doing it.

### The signal/coverage colour ramp (two files, kept in lockstep)

The downlink-bandwidth ramp (critical red → low orange → medium yellow → good NVIDIA-green
→ excellent cyan) lives in **`lib/geo/color.ts`** as `SIGNAL_STOPS` and is **mirrored** as
`--color-sig-*` tokens in `globals.css` so the legend (CSS) and the map (JS) can never
drift. **If you change the ramp, change both files.** Consume it via `mbpsToRGB`,
`rampRGB`, `signalGradientCss` — don't re-implement it.

---

## 2. Signature HUD utilities

Defined in `globals.css`. These _are_ the HUD's identity — use them rather than
re-inventing the look:

- **`.hud-frame`** — green corner-tick brackets (the panel signature). Needs a
  `position: relative` parent (the utility sets it). Exposed as the `frame` prop on `Panel`.
- **`.eyebrow`** — uppercase, tracked (`0.16em`), 10px, weight-600 micro-label. The
  signature label style — used for every panel header and readout caption.
- **`.readout`** — JetBrains Mono with `tabular-nums` (`tnum`) so digits align. Use for
  every number/telemetry value.
- **`.scanlines`** — faint CRT scanline overlay (`scanlines` prop on `Panel`).
- **`.bg-grid`** — 32px green grid background.
- **`.glow-green`** / **`.text-glow`** — green box-shadow / text-shadow glow.
- **Glassmorphism** — floating overlays use `bg-panel/80 backdrop-blur-sm`.
- **Motion** — `.animate-pulse-soft` (2s breathe), `.animate-blink` (1.1s), `.shimmer`
  (loading sweep). All are disabled under `@media (prefers-reduced-motion: reduce)` —
  keep that guard when adding keyframes.

---

## 3. Primitives — compose, don't re-build

Base building blocks live in `components/primitives/` (barrel: `components/primitives/index.ts`).
Build new UI by composing these, not raw `<div>`s, so the look stays consistent:

| Primitive | Role |
| --- | --- |
| `Panel`, `PanelHeader`, `PanelBody` | The framed surface for every rail/console block. Props: `frame`, `scanlines`, `glow`. |
| `Button` | Variants `ghost \| outline \| solid \| danger`, sizes `sm \| md`. |
| `Toggle` | HUD switch (Radix). |
| `Slider` | Thin HUD slider (Radix). |
| `Readout` | Labelled mono numeric (`label` + `value` + `unit`). `formatCompact()` for big numbers. |
| `StatusDot` | Status pip — `nominal \| warning \| critical \| info \| idle`, optional `pulse`. |
| `Tooltip`, `TooltipProvider` | Radix tooltip (provider mounts at the shell root). |
| `Dialog` | Framed modal (Radix). |

Live, executable references for these are the Storybook stories in `stories/` — read those
for real usage rather than guessing props.

Styling utility: **`lib/cn.ts`** (`cn()` = clsx + tailwind-merge) — always merge classes
through it so conditional Tailwind classes resolve safely.

---

## 4. Shell & layout

`components/shell/AppShell.tsx` hosts the map (`MapMount`, always visible) and three
collapsible rails driven by Zustand `panels` state (persisted via `app/providers.tsx`):

| Region | Expanded width/height | Collapsed |
| --- | --- | --- |
| Left rail | 320px | 34px spine |
| Right rail | 372px | 34px spine |
| Bottom bar | 150px | 34px spine |

TopBar is `h-12`; WorkspaceTabs (`h-9`) switch the 5 workspaces (Mission, Coverage,
Optimiser, Agent, Scenarios). Per-workspace content overlays the map with
`pointer-events-none` so the map stays interactive.

To add a panel/readout/tab, use the **`add-hud-panel`** skill — it encodes the
compose-from-primitives + Zustand-selector + persistence + story recipe.

---

## 5. State (where UI state lives)

Shared UI state is the **Zustand store** (`store/index.ts`) with selector hooks
(`useKpis`, `useSites`, `useSelectedSite`, `usePanels`, …). New shared state goes in the
store with a selector hook — _not_ React context, _not_ component-local state that other
panels need. Persisted state follows the localStorage hydrate/persist pattern in
`app/providers.tsx`. See `docs/INVARIANTS.md` for why this is locked.

---

## 6. Mechanical guards (so the design can't silently drift)

- **ESLint token rule** (`eslint.config.mjs`) — bans raw HUD hex literals and hardcoded
  `border-radius` in the DOM HUD chrome (`components/{shell,panels,primitives,kpi,agent,scenario,layers,optimiser}`).
  It deliberately **excludes** `components/cesium/**` and the deck/map GL layers, which use
  raw hex for WebGL materials. If lint flags you, use the token (`text-nv`, `rounded-[var(--radius-hud)]`).
- **Storybook** — primitive + layer stories in `stories/` are drift-proof design references.
- See `docs/INVARIANTS.md` for the architectural locks (StrictMode, map seam, etc.).
