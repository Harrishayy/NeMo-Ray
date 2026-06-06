# Map surface — integration note

The map is a **swappable surface** behind one stable contract. The app shell
renders exactly one thing: `<MapMount />`. Everything else here is an
implementation detail you can replace.

## The contract: `MapSurfaceProps`

Defined in [`@/lib/types`](../../lib/types.ts) (search `MapSurfaceProps`). Every
implementation receives **props only** — it must NOT read from the Zustand store
directly. `MapMount` is the single component that touches the store; it
assembles `MapSurfaceProps` and passes it down.

```ts
interface MapSurfaceProps {
  sites: Site[];
  radioMap: RadioMap | null;          // may be null — render gracefully
  selectedSiteId: SiteId | null;
  hoveredSiteId: SiteId | null;
  deactivatedSiteIds: SiteId[];
  proposals: Proposal[];
  layers: Record<LayerId, LayerState>; // respect .visible / .opacity per layer
  coverageStatus: CoverageStatus;
  viewState?: MapViewState;
  onSelectSite(id: SiteId | null): void;
  onHoverSite(id: SiteId | null): void;
  onViewStateChange?(v: MapViewState): void;
}
```

Positions: use `site.placement {x,y}` (normalised 0..1, y=0 at north) for screen
work, or `site.position` / `cell.centroid` / `deadZone.centroid` ([lng,lat]) for
georeferenced work. `RadioMap` also carries `bbox`, `gridW`, `gridH`.

## Switching implementations

`MapMount` chooses the impl from an env var (default `placeholder`):

```bash
NEXT_PUBLIC_MAP_IMPL=placeholder   # bundled interactive placeholder (default)
NEXT_PUBLIC_MAP_IMPL=deck          # your deck.gl scene
```

Flipping that env var is the **only** switch. When set to `deck`, `MapMount`
dynamically imports `./DeckScene` and falls back to the placeholder if the
module isn't there yet — so the demo never breaks while you build.

## What you build: `components/map/DeckScene.tsx`

Create a client component that implements `MapSurfaceProps` 1:1:

```tsx
"use client";
import type { MapSurfaceProps } from "@/lib/types";

export function DeckScene(props: MapSurfaceProps) {
  // ...deck.gl here. props only — no store imports.
}
```

You can reuse the DOM overlays from this folder so the HUD stays consistent:
`MapOverlayHUD` (selected-site callout + status chip — reads the store itself,
render it as a sibling on top of your canvas) and `CoverageLegend`
(`signalGradientCss()` ramp).

### Recommended deck.gl stack

- **Base:** `Tile3DLayer` + Google Photorealistic 3D Tiles (set an oblique
  `pitch`/`bearing` `MapViewState`; wire `onViewStateChange`).
- **Radio map:** drape `radioMap.raster` (if present) as a `BitmapLayer`, OR
  render `radioMap.cells` as a `PolygonLayer`/`ColumnLayer` grid coloured by
  `mbpsToRGB(cell.dlMbps)` from [`@/lib/geo/color`](../../lib/geo/color.ts).
  Respect `layers.radioMap.visible/opacity`.
- **Beams:** `ColumnLayer` per active site, height ∝ `txPowerDbm`
  (`layers.beams`).
- **Backhaul:** `ArcLayer` from each site to `backhaulTargetId`
  (`layers.backhaul` / `layers.arcs`).
- **Sites:** `ScatterplotLayer` / `IconLayer`; `onClick → onSelectSite`,
  `onHover → onHoverSite`; highlight `selectedSiteId` / `hoveredSiteId`.
- **Dead zones:** red `PolygonLayer` / `ScatterplotLayer` at
  `deadZone.centroid` sized by `radius`, keyed off `severity`
  (`layers.deadzone`). This is the deactivation money-shot.
- **Proposals:** ghost markers at `proposal.placement` / `proposal.position`.

Keep colours on-brand by sourcing them from `@/lib/geo/color` so the legend and
map never drift.

## Files

| File | Role |
| --- | --- |
| `MapMount.tsx` | Store → `MapSurfaceProps`; picks impl via env; loading skeleton. |
| `MapPlaceholder.tsx` | Bundled interactive placeholder (default impl). |
| `MapOverlayHUD.tsx` | DOM overlay: selected-site callout + live status chip. |
| `CoverageLegend.tsx` | Downlink Mbps ramp legend. |
| `DeckScene.tsx` | **You build this** — the real deck.gl surface. |
