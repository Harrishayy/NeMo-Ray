import type { KPI, RadioMap, Site, SiteId } from "@/lib/types";

/** Deterministic sparkline trending toward `end`, length `n`. */
function series(seed: number, end: number, n = 24, swing = 0.12): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wobble =
      Math.sin(seed + i * 0.9) * swing + Math.sin(seed * 1.7 + i * 0.33) * swing * 0.5;
    const base = end * (0.82 + 0.18 * t);
    out.push(Math.max(0, base * (1 + wobble * (1 - t))));
  }
  out[n - 1] = end;
  return out;
}

/** Derive the six headline KPIs from current network state. */
export function computeKpis(
  sites: Site[],
  deactivatedSiteIds: SiteId[],
  radioMap: RadioMap | null,
): KPI[] {
  const dead = new Set(deactivatedSiteIds);
  const active = sites.filter((s) => !dead.has(s.id));
  const totalSites = sites.length;
  const activeCount = active.length;

  const subscribers = active.reduce((s, x) => s + x.load, 0);
  const lostSubs = sites
    .filter((s) => dead.has(s.id))
    .reduce((s, x) => s + x.load, 0);

  const cells = radioMap?.cells ?? [];
  const avgThroughput = cells.length
    ? cells.reduce((s, c) => s + c.dlMbps, 0) / cells.length
    : 78.6;
  const congested = cells.filter((c) => c.congested).length;
  const criticalZones = (radioMap?.deadZones ?? []).filter(
    (d) => d.severity === "critical",
  ).length;

  const availability = Math.max(
    0,
    Math.min(100, 97.3 - deactivatedSiteIds.length * 1.8 - criticalZones * 0.6),
  );
  const alerts = 1 + deactivatedSiteIds.length + criticalZones;
  const nDown = deactivatedSiteIds.length;

  return [
    {
      id: "subscribers",
      label: "Total Subscribers",
      value: subscribers,
      delta: nDown ? -((lostSubs / (subscribers + lostSubs)) * 100) : 12.4,
      deltaDirection: nDown ? "down" : "up",
      series: series(1, subscribers),
      state: nDown ? "warning" : "nominal",
      format: "compact",
    },
    {
      id: "activeSites",
      label: "Active Sites",
      value: activeCount,
      suffix: `/ ${totalSites}`,
      delta: nDown ? -((nDown / totalSites) * 100) : 2.1,
      deltaDirection: nDown ? "down" : "up",
      series: series(2, activeCount, 24, 0.04),
      state: nDown ? "warning" : "nominal",
      format: "int",
    },
    {
      id: "availability",
      label: "Network Availability",
      value: Math.round(availability * 10) / 10,
      unit: "%",
      delta: nDown ? -(97.3 - availability) : 0.4,
      deltaDirection: nDown ? "down" : "up",
      series: series(3, availability, 24, 0.02),
      state: availability < 95 ? "critical" : availability < 97 ? "warning" : "nominal",
      format: "percent1",
    },
    {
      id: "throughput",
      label: "Avg User Throughput",
      value: Math.round(avgThroughput * 10) / 10,
      unit: "Mbps",
      delta: nDown ? -((78.6 - avgThroughput) / 78.6) * 100 : 18.7,
      deltaDirection: avgThroughput >= 78 ? "up" : "down",
      series: series(4, avgThroughput),
      state: avgThroughput < 50 ? "warning" : "nominal",
      format: "decimal1",
    },
    {
      id: "congestedCells",
      label: "Congested Cells",
      value: congested,
      delta: nDown ? 22 : -5,
      deltaDirection: nDown ? "up" : "down",
      invertDelta: true,
      series: series(5, Math.max(1, congested), 24, 0.25),
      state: congested > 30 ? "warning" : "nominal",
      format: "int",
    },
    {
      id: "criticalAlerts",
      label: "Critical Alerts",
      value: alerts,
      delta: nDown ? 100 : 0,
      deltaDirection: nDown ? "up" : "flat",
      invertDelta: true,
      series: series(6, alerts, 24, 0.4),
      state: alerts > 2 ? "critical" : alerts > 1 ? "warning" : "nominal",
      format: "int",
    },
  ];
}
