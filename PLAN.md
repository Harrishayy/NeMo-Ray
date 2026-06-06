# NeMo-Ray — "AI-RAN Mission Control" Dashboard Plan

> Working plan for the interactive frontend. Living document — edit freely.

## Context

NeMo-Ray is a GPU digital twin of the UK Emergency Services Network (ESN) 4G
coverage: OpenCellID towers + OSM buildings → **Sionna RT** ray-traced coverage
maps → **cuOpt** proposes new masts → **Nemotron** agent reality-checks each
proposal against LiDAR. We're building the **bespoke, NVIDIA-grade "AI-RAN
Mission Control" frontend** that surrounds it.

**This plan's scope:** build the *entire dashboard* — the HUD shell, network-
status rail, agent console + tool pipeline, ElevenLabs voice, scenarios, event
timeline, cuOpt optimiser, and the full design system — but **leave the 3D map
itself as a clean, swappable placeholder**. A collaborator owns the real map
(deck.gl + Google Photorealistic 3D Tiles). We define the exact prop contract it
plugs into, so their work drops in with **zero changes to the rest of the app**.

The app (`nemoray/`) is a fresh **Next.js 16.2.7 / React 19 / Tailwind v4 /
pnpm** scaffold (Geist fonts, `@/*` → nemoray root, Node 24). Nothing else is
installed yet.

### Decisions (confirmed)
1. **Map = placeholder, collaborator-owned.** We ship an interactive stylised
   placeholder behind a typed `MapSurfaceProps` contract; the real deck.gl scene
   implements the same contract and swaps in via one flag. **No deck.gl/maplibre
   deps installed now.**
2. **Layout:** the **map dominates** (center/left, most of the screen). The
   side rails (network status / layers on the left, agent + voice on the right)
   and the bottom bar (timeline + scenarios) are **collapsible**, so the map can
   go near-fullscreen for a clean demo.
3. **Aesthetic:** **dense mission-control HUD** — **Saira** (condensed,
   instrument-panel) + a mono for telemetry. Corner ticks, bracket frames,
   subtle scanlines, **NVIDIA green `#76B900`** glow on near-black surfaces.
   Bespoke, no generic pills, no shadcn defaults.
4. **Scope built now:** Mission Control + Coverage Twin + cuOpt Optimiser +
   Agent + Scenarios workspaces, mock-data driven, swappable to the real
   DGX-Spark backend via one env flag.
5. **Voice:** **fully wire ElevenLabs** (STT in / TTS out via server proxies).
   No `ELEVENLABS_API_KEY` → voice control degrades to a disabled "voice
   unavailable" state. No faking.

---

## Layout & UX

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOPBAR  ◢NVIDIA  AI-RAN MISSION CONTROL   CENTRAL LONDON · ESN   ⛆ 12° 15:42 │
├───────┬──────────────────────────────────────────────────┬───────────┤
│ ‹     │                                                  │         › │
│ LEFT  │                                                  │  RIGHT    │
│ RAIL  │              MAP SURFACE  (dominant)             │  RAIL     │
│ KPIs  │        placeholder now → deck.gl later           │  AGENT    │
│ +     │   interactive tower nodes · coverage blobs ·     │  CONSOLE  │
│ LAYERS│   click→deactivate→dead-zone · scanline glow      │  + TOOLS  │
│       │                                                  │  + VOICE  │
├───────┴──────────────────────────────────────────────────┴───────────┤
│ BOTTOM BAR  ‹ EVENT TIMELINE ───●───  SCENARIOS: Live·HighDemand·… › │
└──────────────────────────────────────────────────────────────────────┘
```

- **Map is the hero.** CSS grid: fixed-but-collapsible left/right columns and a
  collapsible bottom row; the map cell is `1fr`/`1fr` and fills everything left
  over. Collapsing all three → near-fullscreen map.
- **Collapsible panels.** Each rail/bar has an edge **handle** (chevron) that
  collapses it to a thin spine (icon-only) or fully off-screen. Motion animates
  the grid-track size; the map reflows smoothly. Collapse state lives in
  `uiSlice.panels` and persists to `localStorage`. Keyboard shortcuts: `[`
  left, `]` right, `\` bottom, `F` focus/fullscreen-map.
- **Non-scrolling shell.** `h-screen overflow-hidden`; only inner panel bodies
  scroll. Looks like one fixed instrument, not a web page.
- **Demo-ready.** Even with the placeholder map, the whole money-shot works:
  click a tower node → DEACTIVATE → red dead-zone + KPI shift + agent narrates.

---

## The map seam (so the collaborator drops in cleanly)

A single boundary isolates everything map-related:

- **`lib/types.ts` → `MapSurfaceProps`** — the contract both implementations
  satisfy:
  ```ts
  interface MapSurfaceProps {
    sites: Site[];
    radioMap: RadioMap | null;
    selectedSiteId: SiteId | null;
    hoveredSiteId: SiteId | null;
    deactivatedSiteIds: string[];
    layers: Record<LayerId, { visible: boolean; opacity: number }>;
    coverageStatus: CoverageStatus;
    viewState?: MapViewState;
    onSelectSite(id: SiteId | null): void;
    onHoverSite(id: SiteId | null): void;
    onViewStateChange?(v: MapViewState): void;
  }
  ```
- **`components/map/MapMount.tsx`** — the only thing the shell renders. Reads
  store state, passes `MapSurfaceProps` down, and chooses the implementation via
  `NEXT_PUBLIC_MAP_IMPL` (`placeholder` | `deck`). Wrapped in `dynamic(ssr:false)`
  so the future WebGL impl needs no extra wiring.
- **`components/map/MapPlaceholder.tsx`** (ours, now) — implements
  `MapSurfaceProps` with a **beautiful, interactive stand-in**: a near-black
  HUD-framed canvas/SVG with a faint perspective grid + scanlines + NVIDIA-green
  vignette, **tower nodes drawn from `sites`** (pickable → `onSelectSite`),
  soft **coverage blobs** colored by the `radioMap` cells, a pulsing **red
  dead-zone** where a site is deactivated, a "COVERAGE TWIN · PLACEHOLDER —
  AWAITING RT RENDER" ribbon, and a `coverageStatus:'computing'` shimmer. It is
  *intentional-looking*, not a TODO box, and fully demoable.
- **`components/map/DeckScene.tsx`** (collaborator, later) — implements the same
  `MapSurfaceProps`; flip `NEXT_PUBLIC_MAP_IMPL=deck` and nothing else changes.
- **`components/map/README.md`** — short integration note for the collaborator:
  the contract, the `MapMount` switch, the store selectors to read, and the
  events to emit.

This means the map is genuinely modular: our work never imports deck.gl, theirs
only imports `lib/types.ts` + the store selector hook.

---

## Architecture

### Principles
- **Map behind one prop contract** (`MapSurfaceProps` / `MapMount`) — see above.
- **Everything is a pure function of a Zustand store.** Deactivating a tower is
  a state mutation; KPIs, dead-zone, agent narration all derive from it.
- **One data contract (`lib/types.ts`).** UI imports only `lib/types.ts` +
  `lib/api/*`, never mock or raw-backend shapes → mock↔real is a one-env-var swap.
- **Strict client/SSR boundary.** Interactive bits are `'use client'`; `MapMount`
  is the `dynamic(ssr:false)` entry.

### File / folder structure (under `nemoray/`, `@/` → this dir)
```
app/
  layout.tsx                  # body → h-screen overflow-hidden; load Saira + mono; <Providers>
  globals.css                 # @theme tokens: NVIDIA palette, signal ramp, HUD utilities
  providers.tsx               # 'use client' store/theme boundary
  page.tsx                    # redirect → /mission
  (workspaces)/
    layout.tsx                # AppShell (TopBar + WorkspaceTabs + persistent MapMount + collapsible panels)
    mission/page.tsx          # Mission Control (full HUD)
    coverage/page.tsx         # Coverage Twin (map-forward + layers + legend)
    optimiser/page.tsx        # cuOpt proposals + accept/reject + Nemotron validation
    agent/page.tsx            # large agent console + voice
    scenarios/page.tsx        # scenario authoring + timeline
  api/
    agent/route.ts            # SSE stream: Nemotron proxy (mock script now)
    coverage/route.ts         # POST {scenario, deactivated[]} → RadioMap (mock now)
    voice/stt/route.ts        # ElevenLabs STT proxy (real; 503 if no key)
    voice/tts/route.ts        # ElevenLabs TTS proxy → audio stream (real; 503 if no key)
components/
  shell/        AppShell, TopBar, WorkspaceTabs, StatusClock, CollapsiblePanel, PanelHandle
  panels/       LeftRail, RightRail, BottomBar
  kpi/          KpiGrid, KpiCard, Sparkline (hand-rolled SVG), Delta
  map/          MapMount, MapPlaceholder, MapOverlayHUD, CoverageLegend, README.md
  agent/        AgentConsole, AgentMessage, AgentComposer, ToolPipeline, ToolCard, VoiceControl
  scenario/     ScenarioTabs, EventTimeline, TimelineMarker
  layers/       LayerToggleList, LayerToggle   (left-rail MAP LAYERS)
  optimiser/    ProposalList, ProposalCard, ValidationVerdict
  primitives/   Panel, PanelHeader, Toggle, Tabs, Tooltip, Dialog, Slider, StatusDot, Readout
                (thin Radix wrappers styled as HUD chrome — NOT default shadcn)
lib/
  types.ts                    # data contract incl. MapSurfaceProps
  config.ts                   # USE_MOCK, MAP_IMPL, key-presence flags, London bbox
  cn.ts                       # clsx + tailwind-merge
  geo/        bbox.ts, color.ts (bandwidth→RGBA ramp shared by map + legend)
  mock/       sites.ts, radioMap.ts (dead-zone algo), scenarios.ts, agent.ts, kpis.ts
  api/        client.ts, coverage.ts, agent.ts, voice.ts   (mock|real switch)
hooks/        useStreamingAgent, useVoice, useTimelinePlayback, usePanelCollapse, useMediaQuery
store/        index.ts + slices: scenario, network, layers, timeline, agent, voice, ui
```

### State (Zustand, one store, sliced)
- **network:** `sites`, `deactivatedSiteIds`, `selectedSiteId`, `hoveredSiteId`,
  `radioMap`, `coverageStatus`, `kpis`; actions `selectSite`, `hoverSite`,
  `deactivateSite`, `reactivateSite`, `recomputeCoverage()`.
- **scenario:** `activeScenarioId`, `scenarios`; switching resets baseline.
- **layers:** per-layer `{visible, opacity}` (radioMap, beams, arcs, sites,
  deadzone, labels).
- **timeline:** `mode`, `positionMs`, `events`, `playing`, `speed`.
- **agent:** `messages`, `streaming`, `toolCalls`.
- **voice:** `available`, `recording`, `transcribing`, `speaking`, `ttsQueue`.
- **ui:** `activeWorkspace`, `panels:{left,right,bottom}` collapse, `mapFocus`.

**Deactivate → dead-zone (money shot):** tower node click → `selectSite` → HUD
callout "DEACTIVATE" → `deactivateSite(id)` sets `coverageStatus:'computing'` →
`recomputeCoverage()` → `lib/api/coverage.getRadioMap(scenario,[...dead])` (mock
punches a low-power void; real → `/api/coverage`→Sionna) → `setRadioMap` +
recompute KPIs → `MapPlaceholder` re-derives (red dead-zone, node greys out),
KPIs shift, agent auto-narrates via the tool pipeline.

### Data contract (`lib/types.ts`)
`Site` · `CoverageCell` · `RadioMap` (cells[], deadZones[], optional georef
`raster`) · `DeadZone` · `Scenario` (events[], seedDeactivated[]) · `EventMarker`
· `KPI` (value, delta, series[] sparkline, state) · `AgentMessage` · `ToolCall`
(diagnose_site|predict_root_cause|activate_failover|run_cuopt|validate_site) ·
`Proposal` (cuOpt) · `AgentStreamEvent` (SSE union) · **`MapSurfaceProps`** ·
`MapViewState` · `LayerId` · `CoverageStatus`.

### Agent + voice
- `app/api/agent/route.ts` → `text/event-stream`. Mock replays
  `lib/mock/agent.ts` (token chunks + interleaved tool events); real proxies
  DGX-Spark Nemotron — same `AgentStreamEvent` union. `useStreamingAgent` → store.
- `ToolPipeline` renders `toolCalls` as Motion-animated cards (queued → running →
  success/error). Auto-fires on deactivation.
- **Voice:** `useVoice` + `VoiceControl`. STT: push-to-talk → `/api/voice/stt`
  (ElevenLabs) → operator message → `streamAgent`. TTS: on `message_end` →
  `/api/voice/tts` → audio playback. Keys server-side only. No key →
  `voice.available=false` → disabled "voice unavailable" control.

### Workspaces
Route group `(workspaces)` + one shared `AppShell` with the **persistent
`MapMount`** (never remounts). Each `page.tsx` configures store/panels
(`uiSlice.activeWorkspace`, default collapse + layer visibility). URLs:
`/mission`, `/coverage`, `/optimiser`, `/agent`, `/scenarios`. `WorkspaceTabs` =
HUD segments (corner ticks / underline), not pills.

---

## Design system (NVIDIA HUD)
`globals.css` `@theme` tokens (Tailwind v4, no `tailwind.config.js`):
- **Surfaces:** `--nv-bg:#0a0e0a`/near-black, layered panels `#0f1410`/`#121a12`,
  hairline borders `rgba(118,185,0,.18)`.
- **Accent:** `--nv-green:#76b900` (primary), brighter `#8fe000` for glow/active;
  used sparingly on rules, active states, beams.
- **Signal ramp** (coverage/legend, shared map+legend): critical `#ff3b30` →
  low `#ff8a00` → med `#ffd60a` → good `#76b900` → excellent `#00d0ff`.
- **State:** nominal green, warning amber, critical red; `StatusDot` + glow.
- **Type:** Saira (UI/labels, condensed), mono (telemetry/numbers).
- **Utilities:** `.hud-frame` (corner ticks via pseudo-elements), `.scanlines`
  (repeating-linear-gradient overlay), `.glow-green` (box/text-shadow),
  `.readout` (mono, tabular-nums). Motion for panel collapse + value transitions.

---

## Dependencies (run from `nemoray/`)
```bash
pnpm add zustand motion lucide-react clsx tailwind-merge
pnpm add @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-slider
```
**No deck.gl / maplibre / loaders.gl** — the collaborator adds those with the
real map. Fonts via `next/font/google`: **Saira** + a mono (Geist Mono present,
or JetBrains Mono). Sparklines hand-rolled SVG. shadcn not used — bespoke
`primitives/` over Radix.

### Env (`.env.local`)
```
NEXT_PUBLIC_USE_MOCK=true            # flip to false for real backend
NEXT_PUBLIC_MAP_IMPL=placeholder     # → 'deck' when collaborator's map lands
NEXT_PUBLIC_API_BASE=...             # DGX-Spark FastAPI base (real mode)
ELEVENLABS_API_KEY=...               # absent → voice unavailable (graceful)
```

### SSR / Turbopack caveats
- `MapMount` is the `dynamic(ssr:false)` entry; store/Motion/Radix/hooks → `'use
  client'`. Keep the static chrome server-rendered where practical.

---

## Phased build order (demo-first)
0. **Shell & theme** — `layout.tsx` (h-screen), `globals.css` HUD tokens + Saira,
   `AppShell` grid, `TopBar`, `StatusClock`, `Panel`/`hud-frame` primitives,
   `page.tsx`→`/mission`. Static but NVIDIA-grade.
1. **Collapsible layout** — `CollapsiblePanel`/`PanelHandle`, `uiSlice.panels`,
   Motion grid-track animation, keyboard shortcuts, `localStorage` persistence,
   map cell flexes to fill. Map-fullscreen toggle.
2. **Map placeholder + money shot** — store (network+layers), `MapMount` +
   `MapPlaceholder` (interactive nodes/blobs/scanlines), tower click → DEACTIVATE
   → `recomputeCoverage` (mock void) → red dead-zone + `MapOverlayHUD` +
   `CoverageLegend` + LeftRail `KpiCard`/`Sparkline` shift.
3. **Agent + voice** — `/api/agent` SSE mock, `AgentConsole` streaming,
   `ToolPipeline` auto-firing on deactivation, `VoiceControl` + `useVoice` +
   ElevenLabs proxies (graceful no-key).
4. **Scenarios + timeline + optimiser** — `ScenarioTabs` (incl. "Infrastructure
   Loss" = seeded signal-down), `EventTimeline` scrubber, cuOpt `ProposalList` +
   Nemotron `ValidationVerdict`; workspaces routing + Export Report.
5. **Real swap (later)** — `NEXT_PUBLIC_USE_MOCK=false` + `NEXT_PUBLIC_MAP_IMPL=
   deck` + `NEXT_PUBLIC_API_BASE`; collaborator's `DeckScene` + DGX-Spark
   proxies. No component changes if the contract held.

---

## Critical files
- `nemoray/lib/types.ts` — data contract incl. `MapSurfaceProps` (the map seam).
- `nemoray/components/map/MapMount.tsx` — the swap point placeholder↔deck.
- `nemoray/components/map/MapPlaceholder.tsx` — beautiful interactive stand-in.
- `nemoray/components/shell/AppShell.tsx` — the collapsible HUD grid.
- `nemoray/store/networkSlice.ts` — deactivation + `recomputeCoverage()` flow.
- `nemoray/app/api/agent/route.ts` — SSE Nemotron driving chat + tool pipeline.
- `nemoray/app/globals.css` — the HUD design system.

## Verification (end-to-end)
1. `cd nemoray && pnpm install && pnpm dev` → loads at `/mission`, no SSR errors,
   full-viewport non-scrolling HUD.
2. **Layout:** collapse left/right/bottom via handles + `[` `]` `\`; map reflows
   to fill; `F` → near-fullscreen map; state persists on reload.
3. **Money shot (placeholder map):** click a tower node → callout → DEACTIVATE →
   red dead-zone opens, node greys, KPIs (availability ↓, congested ↑, alerts ↑)
   + sparklines move; reactivate restores.
4. **Agent:** deactivation auto-fires diagnose_site → predict_root_cause →
   activate_failover; chat streams token-by-token; operator prompt → streamed reply.
5. **Voice:** key set → push-to-talk transcribes + agent replies aloud; no key →
   disabled "voice unavailable" (no errors).
6. **Scenarios/timeline/optimiser:** "Infrastructure Loss" seeds signal-down;
   scrubber + Live/playback work; cuOpt proposals show accept/reject + LiDAR
   validation rationale.
7. **Map swap dry-run:** `NEXT_PUBLIC_MAP_IMPL=deck` falls back gracefully (or
   renders a stub) — proving `MapMount` is the only switch.
8. `pnpm lint` and `pnpm build` pass.

---

## Notes for the map collaborator
Implement `components/map/DeckScene.tsx` satisfying `MapSurfaceProps`
(`lib/types.ts`); read live state via the store selector hook; emit
`onSelectSite`/`onHoverSite`/`onViewStateChange`. Recommended stack (researched):
deck.gl `Tile3DLayer` + **Google Photorealistic 3D Tiles** for London, with a
free MapLibre + OSM building-extrusion fallback; represent ray-traced frequencies
as the **Sionna radio map** (draped `BitmapLayer` raster or colored `PolygonLayer`
cell-grid), tower **beams** (`ColumnLayer`), **bandwidth arcs** (`ArcLayer`), and
a red **dead-zone** polygon. Flip `NEXT_PUBLIC_MAP_IMPL=deck` to go live.
Refs: [Tile3DLayer](https://deck.gl/docs/api-reference/geo-layers/tile-3d-layer) ·
[Google 3D example](https://deck.gl/examples/google-3d-tiles) ·
[sionna-large-radio-maps](https://github.com/NVlabs/sionna-large-radio-maps).
