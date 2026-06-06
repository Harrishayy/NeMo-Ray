---
name: nemoray-design
description: NeMo-Ray design system — the colour palette, typography, spacing/radii, and component specs for the de-robotised NVIDIA-grade AI-RAN mission-control HUD. Use when styling the nemoray/ app or building HUD UI (panels, buttons, readouts, KPIs, agent console, map legend) so it matches the design language.
---

# NeMo-Ray Design System

A de-robotised NVIDIA-grade mission-control system for AI-RAN command surfaces: one green
accent, neutral **slate** surfaces, dense tabular telemetry, soft modern cards. No
corner-ticks, scanlines or neon.

## Reference (read these for values & specs)

| Doc | Contents |
| --- | --- |
| [`reference/colors.md`](reference/colors.md) | Full palette — brand green, slate surfaces, hairlines, text, status + washes, signal ramp, semantic aliases (with hex). |
| [`reference/typography.md`](reference/typography.md) | Manrope + JetBrains Mono, type scale, weights, tracking, the `.nm-eyebrow` / `.nm-readout` / `.nm-prose` patterns. |
| [`reference/spacing.md`](reference/spacing.md) | 4px spacing scale, soft radii, soft shadows, the accent-ring (no neon), motion, z-index. |
| [`reference/components.md`](reference/components.md) | All 13 components — role, `.nm-*` classes, props/variants. |

## Using it

The implementation is plain CSS. Link the single stylesheet (it `@import`s the token files
+ component classes):

```html
<link rel="stylesheet" href="styles.css" />
```

Then style with the `.nm-*` classes and the design tokens:

```html
<section class="nm-card-root">
  <header class="nm-card-header">
    <span class="nm-card-tick"></span>
    <span class="nm-eyebrow">Network status</span>
  </header>
  <div class="nm-card-body">
    <span class="nm-readout" style="color: var(--text-primary)">1,284</span>
  </div>
</section>
```

- **Token files** (the source of truth for values) live in `tokens/`
  (`colors`, `typography`, `spacing`, `base`) and `styles/components.css`. Reference tokens
  (`var(--nv-green)`, `var(--surface-raised)`, `var(--radius-card)`) — never hardcode hex.
- In the **NeMo-Ray app**, the live components are React/TypeScript primitives in
  `nemoray/components/primitives/` that render these same classes; compose from those
  rather than hand-rolling.

## Rules of thumb

- **Green is precious.** Primary actions, active/live state and focus only. Status and
  resting surfaces stay neutral.
- **Every group gets an eyebrow.** Use `.nm-eyebrow` to label panels, fields and KPIs.
- **Numbers are mono.** Any value, count, time or coordinate uses `--font-mono` +
  `tabular-nums` (the `.nm-readout` helper, or `Readout` / `KpiStat`).
- **Depth over borders.** Step the `--surface-*` stack for hierarchy; reserve green borders
  + `--glow-accent` for active state.
- **Soft, not sci-fi.** Rounded cards (`--radius-card`), soft shadows — no corner-ticks,
  scanlines or neon glow.
