export type PathId = string;
export type SiteId = string;

export interface GeoPoint { lon: number; lat: number; height?: number; }

/** Topology of one flow path. Stable unless the network reroutes. */
export interface SignalPath {
  id: PathId;
  siteId: SiteId;
  start: GeoPoint;        // tower
  end: GeoPoint;          // coverage point / UE cluster
  bend?: number;          // lateral curve magnitude, 0 = straight. default ~0.2
  archeight?: number;     // metres of vertical arc at midpoint. default 0 (ground-hugging)
  utilisation: number;    // 0..1 initial value
}

/** One simulation tick. The sim ONLY pushes scalars — never geometry. */
export interface SimulationFrame {
  timestamp: number;                         // epoch ms
  utilisation: Record<PathId, number>;       // 0..1 per path
  throughput?: Record<PathId, number>;       // optional Mbps, for tooltips
}

export interface SignalAlert {
  pathId?: PathId;
  siteId?: SiteId;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  durationMs?: number;                       // how long the alert pulse runs
}

export type Unsubscribe = () => void;

/** ===== THE BOILERPLATE HOOK the simulation team implements ===== */
export interface SignalSimulationSource {
  getInitialPaths(): Promise<SignalPath[]> | SignalPath[];
  onUpdate(cb: (frame: SimulationFrame) => void): Unsubscribe;
  onTopologyChange?(cb: (paths: SignalPath[]) => void): Unsubscribe;
  onAlert?(cb: (alert: SignalAlert) => void): Unsubscribe;
  start(): void;
  stop(): void;
}
