# Spacing, radii, elevation & motion

The radii are the heart of the **de-robotising** refresh: the legacy HUD used a hard 2px on
everything; this system uses a soft, comfortable scale so panels read as modern instrument
cards rather than sharp boxes.

> **Source of truth:** `tokens/spacing.css`.

## Spacing · 4px base

`--space-0` 0 · `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 ·
`--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48 ·
`--space-16` 64 · `--space-20` 80 (px).

Component rhythm: `--pad-card` 24px (roomy card padding) · `--gap-card` 16px (between
stacked cards) · `--gap-tight` 8px.

## Radii · soft, modern

| Token | Value | Use |
| --- | --- | --- |
| `--radius-xs` | 4px | Chips/tags |
| `--radius-sm` | 8px | Controls |
| `--radius-md` | 12px | **Default card / panel** |
| `--radius-lg` | 16px | |
| `--radius-xl` | 22px | |
| `--radius-pill` | 999px | Tracks, switches, legend bars |

Semantic: `--radius-card` = md (12px) · `--radius-control` = sm (8px) ·
`--radius-chip` = xs (4px, tags are rectangular not pills).

## Elevation · conventional soft shadows

| Token | Value |
| --- | --- |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.35)` |
| `--shadow-md` | `0 4px 14px -6px rgba(0,0,0,0.5)` |
| `--shadow-lg` | `0 16px 40px -18px rgba(0,0,0,0.6)` |
| `--shadow-card` | faint inner top-highlight + soft drop (the default panel shadow) |

**Active state = a clean ring, not a neon bloom:**
`--glow-accent` = `0 0 0 1px var(--line-accent)` · `--glow-accent-strong` =
`0 0 0 1px var(--nv-green)` · `--glow-text` = `none`. Status pips get a 3px whisper of lift
(`--glow-nominal` / `-warning` / `-critical` / `-info`).

## Motion

- **Easing:** `--ease-out` `cubic-bezier(0.22,1,0.36,1)` · `--ease-in-out`
  `cubic-bezier(0.65,0,0.35,1)` · `--ease-spring` `cubic-bezier(0.34,1.56,0.64,1)`.
- **Duration:** `--dur-fast` 120ms · `--dur-base` 200ms · `--dur-slow` 320ms.
- Pulses (`.nm-pulse` / `.nm-blink` / `.nm-shimmer`) are reserved for **live** and
  **critical** signals; all decorative motion respects `prefers-reduced-motion`.

## Z-index

`--z-base` 0 · `--z-overlay` 10 · `--z-rail` 20 · `--z-popover` 40 · `--z-dialog` 50 ·
`--z-toast` 60.
