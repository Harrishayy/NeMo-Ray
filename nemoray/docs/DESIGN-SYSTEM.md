# NeMo-Ray Design System

The HUD's visual language: a **de-robotised NVIDIA-grade mission control.** Neutral
**slate** surfaces, a single restrained NVIDIA green `#76B900` accent used sparingly,
**soft 12px rounded** cards with gentle shadows, **Manrope** + JetBrains Mono telemetry.
This is an evolution of the original sci-fi HUD: same mission-control DNA, but the hard
2px corner-ticks, scanlines and neon glow are gone — it reads as a calm, modern
enterprise tool. This document **describes** the design system; it is not the source of
the values.

> ## Precedence — read this first
> The **code defines, this doc describes.** Canonical sources:
> - **Design tokens (raw values)** → `app/styles/tokens/*.css` (`colors`, `typography`,
>   `spacing`, `base`) — the `:root` custom properties (`--nv-green`, `--surface-*`,
>   `--radius-card`, …). These are the source of truth, ported from the `nemoray-design`
>   system.
> - **Tailwind utility bridge** → the `@theme` block in `app/globals.css` mirrors the raw
>   tokens under legacy `--color-*` names so existing utilities (`bg-panel`, `text-ink`, …)
>   keep working and resolve to the new values.
> - **Component classes** → `app/styles/components.css` (the `.nm-*` classes).
> - **Signal/coverage colour ramp** → `lib/geo/color.ts` (`SIGNAL_STOPS`, `rampRGB`,
>   `signalGradientCss`).
> - **Data contract** → `lib/types.ts` (`MapSurfaceProps`, `Site`, `RadioMap`, …).
>
> This doc **must never paste a second copy** of a token value or a type. If it disagrees
> with the code, **the code wins and this doc is the bug** — fix the doc.

When you change the look of the UI, prefer the **`change-design-tokens`** skill — it walks
the gotchas (e.g. the ramp is mirrored in two places).

---

## 1. Design tokens

Raw token values live **once** in `app/styles/tokens/*.css` as `:root` custom properties
(reference them as `var(--nv-green)`, `var(--surface-raised)`, `var(--radius-card)`). The
`@theme` block in `app/globals.css` mirrors them under the legacy `--color-*` names, which
makes them available as Tailwind utilities (`bg-panel`, `text-ink`, `border-hairline`, …).
**Reference tokens or `.nm-*` classes — never hardcode raw hex** in DOM chrome. (An ESLint
rule enforces the no-hex part for the HUD chrome; see §6.)

Token families (see `app/styles/tokens/` for exact values):

| Family | Tokens | Purpose |
| --- | --- | --- |
| Surfaces | `--surface-bg`, `--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-elevated`, `--surface-inset` | Neutral slate stack (app ground → raised controls). Build depth by stepping the stack, not by adding borders. |
| Lines | `--line-subtle`, `--line`, `--line-strong`, `--line-accent`, `--grid-line` | Neutral low-alpha white hairlines; green lines (`--line-accent`) reserved for active state. |
| Brand | `--nv-green`, `--nv-green-bright`, `--nv-green-dim`, `--nv-green-glow`, `--nv-green-wash(-soft)` | The single green accent — primary actions, active/focus only. Never large fills, never neon. |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-faint`, `--text-on-accent` | Four-step text hierarchy + on-accent. |
| Status | `--status-{nominal,warning,critical,info,idle}` + `--wash-*` | Standard (slightly muted) state colours, each with a wash background. |
| Signal ramp | `--signal-critical` … `--signal-excellent`, `--signal-gradient` | The downlink-bandwidth scale. **Kept vivid** — mirror of `lib/geo/color.ts` (see below). |
| Type | `--font-sans`/`--font-display` (Manrope), `--font-mono` (JetBrains Mono), plus `--text-*`/`--weight-*`/`--leading-*`/`--tracking-*` scales | Fonts loaded via `next/font` in `app/layout.tsx`. |
| Spacing / radii | `--space-*`, `--pad-card`, `--radius-{xs,sm,md,lg,xl,pill}`, `--radius-card` (12px), `--radius-control` (8px) | 4px base; soft modern radii. |
| Elevation / motion | `--shadow-{sm,md,lg,card}`, `--glow-accent`, `--ease-*`, `--dur-*`, `--z-*` | Soft drop shadows; active = a clean 1px accent ring (`--glow-accent`), never a neon bloom. |

**Brand-locked values** — changing these is a deliberate re-brand, not a tweak: the
NVIDIA green `--nv-green` and the neutral slate surface stack. Surface such a change to a
human first. (The radius is **no longer** locked sharp — soft `--radius-card` is the
de-robotised default.)

### The signal/coverage colour ramp (two files, kept in lockstep)

The downlink-bandwidth ramp (critical red → low orange → medium yellow → good
NVIDIA-green → excellent cyan) lives in **`lib/geo/color.ts`** as `SIGNAL_STOPS` and is
**mirrored** as the `--signal-*` tokens in `app/styles/tokens/colors.css` so the legend
(CSS) and the map (JS) can never drift. This ramp is **deliberately kept vivid** (the rest
of the palette de-robotised, but the data-viz scale stays high-contrast for readability).
**If you change the ramp, change both files.** Consume it via `mbpsToRGB`, `rampRGB`,
`signalGradientCss` — don't re-implement it.

---

## 2. Component classes & utilities

Component styling is **class-based** (`.nm-*`), defined in `app/styles/components.css`
(components) and `app/styles/tokens/base.css` + `typography.css` (utilities). Use these
rather than re-inventing the look:

- **`.nm-card` / `.nm-card-root`** — the modern soft-rounded slate card (replaces the old
  `.hud-frame`). `.nm-card-root--active` adds the soft accent ring for active state.
- **`.nm-eyebrow`** — uppercase, tracked (`--tracking-eyebrow`), 10px micro-label. The
  signature label style — used for every panel header and readout caption.
- **`.nm-readout`** — JetBrains Mono with `tabular-nums` so digits align. Use for every
  number/telemetry value.
- **`.nm-glow` / `.nm-glow-strong`** — the soft 1px accent ring (active emphasis), not a
  neon bloom.
- **`.nm-grid-bg`** — faint neutral perspective grid (map wells, hero panels).
- **`.nm-vignette`** — radial vignette wash for map / hero surfaces.
- **`.nm-tabular`** — tabular-nums helper.
- **Motion** — `.nm-pulse` (2s breathe), `.nm-blink` (1.1s), `.nm-shimmer` (loading
  sweep). All are disabled under `@media (prefers-reduced-motion: reduce)` — keep that
  guard when adding keyframes.

> **Removed in the de-robotise:** the legacy `.hud-frame` corner-ticks, `.scanlines` CRT
> overlay, and `.glow-green`/`.text-glow` neon. Don't reintroduce them.

---

## 3. Primitives — compose, don't re-build

Base building blocks live in `components/primitives/` (barrel: `components/primitives/index.ts`).
They render the `.nm-*` classes internally; Radix-backed primitives keep their Radix
behaviour and APIs. Build new UI by composing these, not raw `<div>`s:

| Primitive | Role |
| --- | --- |
| `Panel`, `PanelHeader`, `PanelBody` | The soft-rounded slate surface for every rail/console block. `glow` → active accent ring. (`frame`/`scanlines` props are still accepted for compatibility but no longer render anything.) |
| `Button` | Variants `ghost \| outline \| solid \| danger`, sizes `sm \| md`. |
| `Badge` | Rectangular label/tag. `tone`: `neutral \| solid \| nominal \| warning \| critical \| info`. |
| `Toggle` | Compact switch (Radix). |
| `Slider` | Thin range control with a round green-ringed thumb (Radix). |
| `Readout` | Labelled mono numeric (`label` + `value` + `unit`). `formatCompact()` for big numbers. |
| `StatusDot` | Status pip — `nominal \| warning \| critical \| info \| idle`, optional `pulse`. |
| `Tooltip`, `TooltipProvider` | Radix tooltip (provider mounts at the shell root). |
| `Dialog` | Soft-rounded modal (Radix). |

Live, executable references for these are the Storybook stories in `stories/` — read those
for real usage rather than guessing props.

Styling utility: **`lib/cn.ts`** (`cn()` = clsx + tailwind-merge) — always merge classes
through it. Note `.nm-*` classes are opaque to tailwind-merge (passed through untouched).

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

- **ESLint token rule** (`eslint.config.mjs`) — bans raw HUD hex literals in the DOM HUD
  chrome (`components/{shell,panels,primitives,kpi,agent,scenario,layers,optimiser}`). Keep
  hex in the token CSS files (`app/styles/`), never inline in chrome `.tsx`. The rule
  deliberately **excludes** `components/cesium/**` and the deck/map GL layers, which use
  raw hex for WebGL materials. If lint flags you, use a token (`text-nv`, `bg-panel`,
  `var(--nv-green)`) or a `.nm-*` class.
- **Storybook** — primitive + layer stories in `stories/` are drift-proof design references.
- See `docs/INVARIANTS.md` for the architectural locks (StrictMode, map seam, etc.).
