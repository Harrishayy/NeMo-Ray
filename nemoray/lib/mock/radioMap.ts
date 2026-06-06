import { LONDON_BBOX, normToLngLat } from "@/lib/geo/bbox";
import { mbpsToLevel } from "@/lib/geo/color";
import { MOCK_SITES } from "@/lib/mock/sites";
import type {
  CoverageCell,
  DeadZone,
  RadioMap,
  ScenarioId,
  Site,
  SiteId,
} from "@/lib/types";

const GRID_W = 30;
const GRID_H = 20;

/** Deterministic value noise in [0,1] so the map is stable across renders. */
function hashNoise(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Normalised-space coverage contribution of one site at a cell. */
function contribution(site: Site, nx: number, ny: number): number {
  const dx = nx - site.placement.x;
  const dy = ny - site.placement.y;
  const dist = Math.hypot(dx, dy);
  // Range scales with tx power; aspect-correct y a touch (bbox is wider than tall).
  const range = 0.07 + (site.txPowerDbm - 43) * 0.012;
  const gain = Math.exp(-((dist / range) ** 2));
  return gain * (0.85 + (site.txPowerDbm - 43) * 0.05);
}

/**
 * The mock Sionna stand-in. Computes a radio map from the active site set;
 * deactivating sites punches measurable dead zones. Same return shape the real
 * `/api/coverage` (Sionna RT) produces, so the UI never knows the difference.
 */
export function computeMockRadioMap(
  scenarioId: ScenarioId,
  deactivatedSiteIds: SiteId[],
  sites: Site[] = MOCK_SITES,
): RadioMap {
  const dead = new Set(deactivatedSiteIds);
  const active = sites.filter((s) => !dead.has(s.id));
  const cells: CoverageCell[] = [];

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const nx = (gx + 0.5) / GRID_W;
      const ny = (gy + 0.5) / GRID_H;

      let strength = 0;
      for (const s of active) strength = Math.max(strength, contribution(s, nx, ny));
      // Soft ambient + deterministic texture.
      strength = strength * 0.95 + 0.04 + hashNoise(gx, gy) * 0.06;

      const dlMbps = Math.max(0, Math.min(150, strength * 150));
      const rsrpDbm = Math.round(-120 + strength * 52);
      const level = mbpsToLevel(dlMbps);

      cells.push({
        id: `c-${gx}-${gy}`,
        gx,
        gy,
        n: { x: nx, y: ny },
        centroid: normToLngLat({ x: nx, y: ny }),
        dlMbps: Math.round(dlMbps * 10) / 10,
        rsrpDbm,
        level,
        congested: level !== "critical" && level !== "low" && hashNoise(gx + 7, gy + 3) > 0.86,
      });
    }
  }

  const deadZones: DeadZone[] = deactivatedSiteIds
    .map((id) => sites.find((s) => s.id === id))
    .filter((s): s is Site => Boolean(s))
    .map((s) => {
      // Does the gap actually persist after neighbours fill in?
      const residual = active.reduce(
        (m, a) => Math.max(m, contribution(a, s.placement.x, s.placement.y)),
        0,
      );
      const severity: DeadZone["severity"] =
        residual < 0.25 ? "critical" : residual < 0.5 ? "major" : "minor";
      return {
        id: `dz-${s.id}`,
        center: s.placement,
        radius: 0.05 + (s.txPowerDbm - 43) * 0.01,
        centroid: s.position,
        severity,
        causeSiteId: s.id,
      };
    });

  return {
    id: `rm-${scenarioId}-${deactivatedSiteIds.slice().sort().join("_") || "base"}`,
    scenarioId,
    bbox: LONDON_BBOX,
    gridW: GRID_W,
    gridH: GRID_H,
    resolutionM: 250,
    cells,
    deadZones,
    generatedAt: Date.now(),
    inputs: { deactivatedSiteIds },
  };
}
