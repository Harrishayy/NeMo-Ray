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
NEXT_PUBLIC_MAP_IMPL=cesium        # the live CesiumJS 3D scene
```

Flipping that env var is the **only** switch. `placeholder` is a dependency-free
canvas mock (fast dev/CI, no Cesium load, no Google Tiles API calls); `cesium`
is the real demo surface.

## The live surface: `components/map/CesiumScene.tsx`

`CesiumScene` implements `MapSurfaceProps` 1:1 and composes the CesiumJS stack
(`CesiumViewer` + `PhotorealisticTiles` + `CesiumPostProcess`). Like every
surface it reads **NOTHING** from the store — props only. The DOM overlays in
this folder render on top so the HUD stays consistent: `MapOverlayHUD`
(selected-site callout + status chip) and `CoverageLegend`
(`signalGradientCss()` ramp).

Editing the scene (effects, post-process, camera, beams, arcs, coverage
volumes)? Use the `edit-cesium-scene` skill — it encodes the order-sensitive
post-process stack and the common "blank map" / WebGL-crash failure modes.

Keep colours on-brand by sourcing them from
[`@/lib/geo/color`](../../lib/geo/color.ts) so the legend and map never drift.

## Files

| File | Role |
| --- | --- |
| `MapMount.tsx` | Store → `MapSurfaceProps`; picks impl via env; loading skeleton. |
| `MapPlaceholder.tsx` | Bundled interactive placeholder (default impl). |
| `CesiumScene.tsx` | The live CesiumJS surface (`NEXT_PUBLIC_MAP_IMPL=cesium`). |
| `MapOverlayHUD.tsx` | DOM overlay: selected-site callout + live status chip. |
| `CoverageLegend.tsx` | Downlink Mbps ramp legend. |
