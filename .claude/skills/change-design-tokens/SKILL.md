---
name: change-design-tokens
description: >-
  Change NeMo-Ray HUD design tokens — colours, fonts, radii, the signal/coverage colour
  ramp, surfaces, or status colours (the nemoray/ Next.js app). Use when restyling the HUD's
  visual language. Encodes the single-source-of-truth rule and the ramp-mirroring gotcha so
  the legend and map never drift and brand-locked values aren't changed by accident.
---

# Change design tokens

Tokens have **one** canonical home. The trap is that the signal ramp is mirrored in two
files. Reference: `nemoray/docs/DESIGN-SYSTEM.md`.

## Recipe

1. **Edit tokens in one place:** `nemoray/app/globals.css` `@theme` block. These become both
   Tailwind utilities (`bg-panel`, `text-nv`) and CSS variables (`var(--color-nv)`). Don't
   paste token values into docs or components — link to globals.css.

2. **The signal/coverage ramp is mirrored — change BOTH or they drift:**
   - JS source of truth: `nemoray/lib/geo/color.ts` (`SIGNAL_STOPS`, `LEVEL_RGB`, thresholds).
   - CSS mirror: `--color-sig-*` tokens in `globals.css`.
   The legend (`signalGradientCss()`) and the map colours both derive from these. If you
   change one ramp file without the other, the legend and the map will disagree.

3. **Brand-locked values need explicit intent** — `--color-nv` (`#76b900`), the near-black
   surface ramp, and `--radius-hud` (2px, sharp) define the identity. Changing them is a
   re-brand, not a tweak — call it out to the human and confirm before doing it.

4. **Don't hardcode the old/new hex in components.** Consumers reference tokens
   (`text-nv`, `border-hairline`, `rounded-[var(--radius-hud)]`). The ESLint chrome rule
   bans raw HUD hex in `components/{shell,panels,primitives,kpi,agent,scenario,layers,optimiser}`.
   `grep -rn` the old hex before and after to catch stragglers. (The Cesium/GL layers are
   exempt and use raw hex for materials — update those manually if a brand colour changed.)

5. **Update prose, not values, in `docs/DESIGN-SYSTEM.md`** if the _meaning_ of a token
   changes — but the doc never holds the canonical value.

## Verify
- `cd nemoray && pnpm lint` (token rule passes) and visually check a panel + the coverage
  legend + the map still agree on colour.
