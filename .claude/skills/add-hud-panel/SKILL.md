---
name: add-hud-panel
description: >-
  Add a panel, rail section, readout, console block, or workspace tab to the NeMo-Ray UI
  (the nemoray/ Next.js HUD). Use when building any new piece of HUD chrome so it matches
  the mission-control design language and wires state correctly. Not for the 3D map/Cesium
  layers (use edit-cesium-scene) or for changing colours/tokens (use change-design-tokens).
---

# Add a HUD panel / readout / tab

Build new HUD chrome by **composing existing primitives and tokens**, not raw markup. This
keeps the NVIDIA mission-control look consistent and wires state the way the app expects.

Authoritative references (read if unsure): `nemoray/docs/DESIGN-SYSTEM.md` (look) and
`nemoray/docs/INVARIANTS.md` (locks). Live prop usage: the stories in `nemoray/stories/`.

## Recipe

1. **Compose from primitives** — import from `@/components/primitives` (barrel
   `components/primitives/index.ts`): `Panel` / `PanelHeader` / `PanelBody`, `Button`,
   `Toggle`, `Slider`, `Readout`, `StatusDot`, `Tooltip`, `Dialog`. Don't hand-roll a panel
   out of `<div>`s.
   - A panel block is typically `<Panel frame><PanelHeader label="…"/><PanelBody>…</PanelBody></Panel>`.

2. **Use the signature styles, not raw values**
   - Micro-labels → `.eyebrow` (or `PanelHeader`'s `label`).
   - Numbers/telemetry → `Readout` / `.readout` (mono, tabular-nums). `formatCompact()` for big numbers.
   - Floating overlay → `bg-panel/80 backdrop-blur-sm`; frame → the `frame` prop / `.hud-frame`.
   - Status pips → `StatusDot` (`nominal|warning|critical|info|idle`).
   - **Never hardcode HUD hex or border-radius** — use tokens (`text-nv`, `border-hairline`,
     `rounded-[var(--radius-hud)]`). The ESLint chrome rule will fail the build otherwise.
   - Merge classes through `cn()` (`@/lib/cn`).

3. **Wire state through the Zustand store** (`@/store`) — use/add a selector hook
   (`useKpis`, `useSites`, `usePanels`, `useSelectedSite`, …). Do **not** introduce React
   context or lift state into a parent that other panels would need to reach. New shared
   state → add it to `store/index.ts` with a selector hook.

4. **If the state should persist** across reloads, follow the localStorage hydrate/persist
   pattern in `app/providers.tsx` (hydrate once after mount so SSR markup matches the default).

5. **Respect the shell layout** — rails are left 320px / right 372px / bottom 150px, 34px
   collapsed spine; TopBar `h-12`, WorkspaceTabs `h-9`. Panels live in `components/panels/`
   (`LeftRail`, `RightRail`, `BottomBar`); a new workspace tab is added in
   `components/shell/WorkspaceTabs.tsx`. Per-workspace overlay content keeps
   `pointer-events-none` where it covers the map.

6. **Add a Storybook story** in `nemoray/stories/<Name>.stories.tsx` mirroring the existing
   `*.stories.tsx` pattern (`Meta` + `StoryObj`, default-export `meta`). Stories are the
   drift-proof design reference.

## Don't
- Don't re-create panel/button styling from scratch — compose primitives.
- Don't read the Zustand store from inside a map **surface** component (that breaks the map
  seam — see `INVARIANTS.md`). Panels are fine to use the store; map surfaces are props-only.
