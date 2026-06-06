# Colour palette

A standard, professional dark-dashboard palette: neutral **slate** surfaces (not
green-tinted near-black), a single restrained **NVIDIA-green** accent used sparingly, and
conventional status colours. No neon, no heavy glow — calm and readable.

> **Source of truth:** the values below are mirrored from `tokens/colors.css` (`:root`
> custom properties). Reference tokens in code (`var(--nv-green)`, `var(--surface-raised)`)
> — never hardcode the hex.

## Brand · green accent (restrained)

`--nv-green` is the **only** brand colour. Use it for primary actions, active/live state
and focus — never large fills, never with a glow.

| Token | Hex / value | Use |
| --- | --- | --- |
| `--nv-green` | `#76B900` | Primary accent — buttons, active state, focus |
| `--nv-green-bright` | `#8FD400` | Hover lift |
| `--nv-green-dim` | `#5F9400` | Pressed / secondary |
| `--nv-green-deep` | `#38500F` | Faint fills, inactive accent |
| `--nv-green-glow` | `rgba(118,185,0,0.22)` | Soft accent halo (used sparingly) |
| `--nv-green-wash` | `rgba(118,185,0,0.12)` | Tinted backgrounds |
| `--nv-green-wash-soft` | `rgba(118,185,0,0.06)` | Faintest tint (hover wells) |

## Surfaces · neutral slate

Six elevation steps. Build depth by **stepping the stack**, not by adding borders.

| Token | Hex | Use |
| --- | --- | --- |
| `--surface-bg` | `#0D0F12` | App background (ground) |
| `--surface-base` | `#131619` | Base panel ground |
| `--surface-raised` | `#181C21` | Cards, panels |
| `--surface-overlay` | `#1F242B` | Popovers, dialogs, hover |
| `--surface-elevated` | `#272D35` | Active rows, raised controls |
| `--surface-inset` | `#0A0C0E` | Wells, tracks, inputs |

## Hairlines · neutral, low-alpha

Lines are low-alpha white. **Green lines are reserved for active state only.**

| Token | Value | Use |
| --- | --- | --- |
| `--line-subtle` | `rgba(255,255,255,0.06)` | Faint dividers |
| `--line` | `rgba(255,255,255,0.10)` | Default border |
| `--line-strong` | `rgba(255,255,255,0.15)` | Emphasised border / control outline |
| `--line-accent` | `rgba(118,185,0,0.45)` | Active border |
| `--line-accent-soft` | `rgba(118,185,0,0.22)` | Soft active border |
| `--grid-line` | `rgba(255,255,255,0.035)` | Perspective grid background |

## Text · four-step hierarchy

| Token | Hex | Use |
| --- | --- | --- |
| `--text-primary` | `#EEF1F3` | Headlines, key readouts |
| `--text-secondary` | `#B4BCC4` | Body copy |
| `--text-tertiary` | `#828C96` | Supporting / muted |
| `--text-faint` | `#5A636D` | Eyebrows, ticks, placeholders |
| `--text-on-accent` | `#0C1500` | Text on green fills |

## Status · standard, slightly muted

Each status has a matching `--wash-*` background at 12% alpha. No neon.

| State | Colour token | Hex | Wash token |
| --- | --- | --- | --- |
| Nominal | `--status-nominal` | `#5CAE3C` | `--wash-nominal` |
| Warning | `--status-warning` | `#E0A52A` | `--wash-warning` |
| Critical | `--status-critical` | `#E0524D` | `--wash-critical` |
| Info | `--status-info` | `#4A90E2` | `--wash-info` |
| Idle | `--status-idle` | `#5A636D` | — |

## Signal ramp · downlink bandwidth

A functional data-viz scale (red → amber → green → blue) shared by the map render and the
`CoverageLegend`. Exposed as `--signal-gradient` for the legend bar.

| Stop | Token | Hex |
| --- | --- | --- |
| Critical | `--signal-critical` | `#E0524D` |
| Low | `--signal-low` | `#E0852A` |
| Medium | `--signal-medium` | `#E0C02A` |
| Good | `--signal-good` | `#5CAE3C` |
| Excellent | `--signal-excellent` | `#4A90E2` |

> **Consuming-app note.** The ramp is a data scale, not chrome. A consumer may keep a more
> **vivid** variant for map/legend contrast (the NeMo-Ray app does: `#FF3B30 / #FF8A00 /
> #FFD60A / #76B900 / #00D0FF`). If you change it, change **both** the CSS token and the
> app's JS ramp (`lib/geo/color.ts`) so the legend and map never drift.

## Semantic aliases

Reference these in components rather than the raw scale where a role exists:

| Alias | Resolves to |
| --- | --- |
| `--bg-app` | `--surface-bg` |
| `--surface-card` / `--surface-card-hover` / `--surface-control` | `--surface-raised` / `--surface-overlay` / `--surface-elevated` |
| `--border-card` / `--border-card-hover` / `--border-control` | `--line` / `--line-strong` / `--line-strong` |
| `--border-focus` | `--nv-green` |
| `--text-body` / `--text-heading` / `--text-muted` / `--text-label` | `--text-secondary` / `--text-primary` / `--text-tertiary` / `--text-faint` |
| `--accent` / `--accent-bright` / `--accent-wash` | `--nv-green` / `--nv-green-bright` / `--nv-green-wash` |
