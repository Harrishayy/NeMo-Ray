# components/ — UI layer

You're in the HUD's component layer. Keep the look consistent:

- **Compose from `primitives/`** (`Panel`, `Button`, `Badge`, `Readout`, `StatusDot`, …) —
  don't hand-roll panels/buttons.
- **Style via tokens + `.nm-*` classes** — raw token values live in `app/styles/tokens/`
  and `app/styles/components.css`; the `@theme` bridge in `app/globals.css` keeps Tailwind
  utilities (`bg-panel`, `text-nv`, `border-hairline`) working. Prefer `.nm-eyebrow`,
  `.nm-readout`, `.nm-card`, or `var(--nv-green)`. **Never hardcode HUD hex** — it's
  lint-enforced for chrome dirs (see `../docs/DESIGN-SYSTEM.md` §6).
- **Merge classes through `../lib/cn.ts`** (`cn()`).
- Shared state → the Zustand store (`../store/index.ts`) selector hooks, not React context.

Full design language: **`../docs/DESIGN-SYSTEM.md`**.
Before any structural change, read **`../docs/INVARIANTS.md`** (locked invariants).
Adding a panel/readout/tab? The `add-hud-panel` skill walks the recipe.

Note: `cesium/` and the GL map layers are a separately-authored integration with their own
conventions (raw hex for WebGL materials, etc.) and are exempt from the token lint rule.
