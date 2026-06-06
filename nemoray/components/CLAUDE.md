# components/ — UI layer

You're in the HUD's component layer. Keep the look consistent:

- **Compose from `primitives/`** (`Panel`, `Button`, `Readout`, `StatusDot`, …) — don't
  hand-roll panels/buttons.
- **Style via tokens + utilities in `app/globals.css`** (`bg-panel`, `text-nv`, `.eyebrow`,
  `.readout`, `.hud-frame`). **Never hardcode HUD hex or `border-radius`** a token covers —
  it's lint-enforced for chrome dirs (see `../docs/DESIGN-SYSTEM.md` §6).
- **Merge classes through `../lib/cn.ts`** (`cn()`).
- Shared state → the Zustand store (`../store/index.ts`) selector hooks, not React context.

Full design language: **`../docs/DESIGN-SYSTEM.md`**.
Before any structural change, read **`../docs/INVARIANTS.md`** (locked invariants).
Adding a panel/readout/tab? The `add-hud-panel` skill walks the recipe.

Note: `cesium/` and the GL map layers are a separately-authored integration with their own
conventions (raw hex for WebGL materials, etc.) and are exempt from the token lint rule.
