# NeMo-Ray Design System

**AI-RAN Mission Control** — the visual language for NeMo-Ray's real-time
radio-access-network command surfaces. A dark instrument aesthetic built around a single
**NVIDIA signal-green** accent, dense telemetry, and a calm, modern card system.

This is an evolution of the product's original HUD: same mission-control DNA, but
**de-robotised** — the hard 2px corner-tick chrome, scanlines and neon glow are replaced
by a **standard professional dark palette**: neutral slate surfaces, soft-rounded cards,
conventional status colours, and a restrained green accent used sparingly. It reads as a
calm, modern enterprise tool, not a sci-fi prop.

## Documentation

The design system is documented in markdown — start at **[`SKILL.md`](SKILL.md)**, then:

- **[`reference/colors.md`](reference/colors.md)** — the full colour palette.
- **[`reference/typography.md`](reference/typography.md)** — fonts, scale, the eyebrow + readout patterns.
- **[`reference/spacing.md`](reference/spacing.md)** — spacing, radii, elevation, motion.
- **[`reference/components.md`](reference/components.md)** — the 13 component specs.

## Files

- `styles.css` — single entry point (consumers link this); it `@import`s everything below.
- `tokens/` — `colors`, `typography`, `spacing`, `fonts`, `base` (CSS custom properties +
  utility classes). **The source of truth for token values.**
- `styles/components.css` — the class-based `.nm-*` component styling + states.
- `reference/` — the markdown design-system documentation.
- `assets/` — the mission-control reference image (the north-star product view).

> The implementation is plain CSS + design tokens. The live, interactive components are the
> React/TypeScript primitives in the consuming app (`nemoray/components/primitives/`), which
> render the `.nm-*` classes documented in `reference/components.md`.
