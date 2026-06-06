/**
 * NeMo-Ray data contract.
 *
 * This is the seam between the UI and the DGX-Spark backend. Components import
 * ONLY from here (and `lib/api/*`) — never from `lib/mock/*` or raw backend
 * shapes. The map's two implementations (placeholder + deck.gl) both satisfy
 * {@link MapSurfaceProps}.
 */

// ── primitives ──────────────────────────────────────────────────────────────
export type LngLat = [number, number];
/** [minLng, minLat, maxLng, maxLat] */
export type BBox = [number, number, number, number];
export type RGB = [number, number, number];
/** Normalised [0,1] position for the placeholder map (0,0 = top-left/NW). */
export interface Norm {
  x: number;
  y: number;
}

// ── network / sites ─────────────────────────────────────────────────────────
export type SiteId = string;
export type Operator = "EE" | "ESN";
export type SiteStatus = "active" | "deactivated" | "failover";

export interface Site {
  id: SiteId;
  name: string;
  /** Real-world position (used by the deck.gl map). */
  position: LngLat;
  /** Normalised position for the placeholder map. Derived from `position`. */
  placement: Norm;
  operator: Operator;
  tech: "LTE";
  band: string;
  heightM: number;
  azimuths: number[];
  txPowerDbm: number;
  coverageRadiusM: number;
  status: SiteStatus;
  /** Site this one back-hauls to (for the arc/backhaul layer). */
  backhaulTargetId?: SiteId;
  /** Subscribers currently served — drives load/congestion. */
  load: number;
}

// ── coverage / radio map ────────────────────────────────────────────────────
export type CoverageLevel =
  | "critical"
  | "low"
  | "medium"
  | "good"
  | "excellent";

export interface CoverageCell {
  id: string;
  /** Grid indices. */
  gx: number;
  gy: number;
  /** Normalised cell centre for the placeholder. */
  n: Norm;
  /** Real-world cell centre for the deck.gl map. */
  centroid: LngLat;
  dlMbps: number;
  rsrpDbm: number;
  level: CoverageLevel;
  congested: boolean;
}

export interface DeadZone {
  id: string;
  /** Normalised centre + radius (placeholder). */
  center: Norm;
  radius: number;
  /** Real-world centroid (deck.gl). */
  centroid: LngLat;
  severity: "minor" | "major" | "critical";
  causeSiteId?: SiteId;
}

export interface RadioMap {
  id: string;
  scenarioId: ScenarioId;
  bbox: BBox;
  gridW: number;
  gridH: number;
  resolutionM: number;
  cells: CoverageCell[];
  deadZones: DeadZone[];
  /** Optional georeferenced raster (real Sionna output) the deck map can drape. */
  raster?: { url: string; bounds: BBox; width: number; height: number };
  generatedAt: number;
  inputs: { deactivatedSiteIds: SiteId[] };
}

export type CoverageStatus = "idle" | "computing" | "ready" | "error";

// ── KPIs ────────────────────────────────────────────────────────────────────
export type KpiState = "nominal" | "warning" | "critical";
export type KpiId =
  | "subscribers"
  | "activeSites"
  | "availability"
  | "throughput"
  | "congestedCells"
  | "criticalAlerts";

export interface KPI {
  id: KpiId;
  label: string;
  value: number;
  /** e.g. "/ 321" rendered after the value. */
  suffix?: string;
  unit?: string;
  /** Percentage change vs. baseline. */
  delta?: number;
  deltaDirection?: "up" | "down" | "flat";
  /** Whether an upward delta is good (throughput) or bad (alerts). */
  invertDelta?: boolean;
  series: number[];
  state: KpiState;
  /** Number formatting hint. */
  format?: "int" | "decimal1" | "percent1" | "compact";
}

// ── scenarios + timeline ────────────────────────────────────────────────────
export type ScenarioId =
  | "live"
  | "high-demand"
  | "major-event"
  | "infrastructure-loss"
  | "cyber-attack"
  | "power-outage";

export type EventKind =
  | "alert"
  | "failover"
  | "congestion"
  | "optimisation"
  | "agent"
  | "info";

export interface EventMarker {
  id: string;
  tMs: number;
  kind: EventKind;
  label: string;
  severity?: "info" | "warning" | "critical";
  siteId?: SiteId;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Sites that begin deactivated in this scenario. */
  seedDeactivated: SiteId[];
  events: EventMarker[];
  /** Timeline span in ms. */
  durationMs: number;
  synthetic: boolean;
}

export type TimelineMode = "live" | "playback";

// ── agent + tools ───────────────────────────────────────────────────────────
export type AgentRole = "agent" | "operator" | "system";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  streaming?: boolean;
  /** Optional collapsed reasoning trace. */
  reasoning?: string;
  toolCallIds?: string[];
  createdAt: number;
}

export type ToolName =
  | "diagnose_site"
  | "predict_root_cause"
  | "activate_failover"
  | "run_cuopt"
  | "validate_site";

export type ToolStatus = "queued" | "running" | "success" | "error";

export interface ToolCall {
  id: string;
  name: ToolName;
  label: string;
  status: ToolStatus;
  args?: Record<string, unknown>;
  result?: string;
  progress?: number;
  startedAt?: number;
  finishedAt?: number;
}

/** SSE wire protocol for `/api/agent`. Identical for mock and real. */
export type AgentStreamEvent =
  | { type: "message_start"; id: string; role: AgentRole }
  | { type: "token"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "tool_update"; id: string; patch: Partial<ToolCall> }
  | { type: "message_end"; id: string }
  | { type: "error"; message: string };

// ── cuOpt optimiser ─────────────────────────────────────────────────────────
export type ProposalStatus =
  | "proposed"
  | "validating"
  | "accepted"
  | "rejected";

export interface Proposal {
  id: string;
  label: string;
  position: LngLat;
  placement: Norm;
  coverageGainPct: number;
  estCostGbp: number;
  rationale: string;
  status: ProposalStatus;
  validation?: {
    source: "LiDAR" | "StreetView";
    verdict: "pass" | "fail";
    reason: string;
  };
}

// ── map surface contract ────────────────────────────────────────────────────
export type LayerId =
  | "radioMap"
  | "beams"
  | "arcs"
  | "sites"
  | "deadzone"
  | "backhaul"
  | "labels";

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

/**
 * The ONE contract every map implementation satisfies. `MapPlaceholder` (ours)
 * and the collaborator's `DeckScene` both accept exactly this — swapping is a
 * single env flag (`NEXT_PUBLIC_MAP_IMPL`).
 */
export interface MapSurfaceProps {
  sites: Site[];
  radioMap: RadioMap | null;
  selectedSiteId: SiteId | null;
  hoveredSiteId: SiteId | null;
  deactivatedSiteIds: SiteId[];
  proposals: Proposal[];
  layers: Record<LayerId, LayerState>;
  coverageStatus: CoverageStatus;
  viewState?: MapViewState;
  onSelectSite(id: SiteId | null): void;
  onHoverSite(id: SiteId | null): void;
  onViewStateChange?(v: MapViewState): void;
}

// ── workspaces ──────────────────────────────────────────────────────────────
export type Workspace =
  | "mission"
  | "coverage"
  | "optimiser"
  | "agent"
  | "scenarios";
