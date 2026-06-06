import type { Scenario, ScenarioId } from "@/lib/types";

const HOUR = 3600_000;

export const MOCK_SCENARIOS: Record<ScenarioId, Scenario> = {
  live: {
    id: "live",
    label: "Live",
    description: "Real-time operational feed across the central London cell grid.",
    seedDeactivated: [],
    durationMs: 6 * HOUR,
    synthetic: false,
    events: [
      { id: "e-l1", tMs: 0.5 * HOUR, kind: "info", label: "Shift handover — NOC-01", severity: "info" },
      { id: "e-l2", tMs: 2.1 * HOUR, kind: "congestion", label: "Congestion rising · City of London", severity: "warning", siteId: "CLN-G02" },
      { id: "e-l3", tMs: 3.4 * HOUR, kind: "optimisation", label: "cuOpt proposed 2 infill sites", severity: "info" },
      { id: "e-l4", tMs: 4.8 * HOUR, kind: "alert", label: "RSRP dip · Brixton edge", severity: "warning", siteId: "CLN-G15" },
    ],
  },
  "high-demand": {
    id: "high-demand",
    label: "High Demand",
    description: "Rush-hour subscriber surge stressing the busiest cells.",
    seedDeactivated: [],
    durationMs: 4 * HOUR,
    synthetic: true,
    events: [
      { id: "e-h1", tMs: 0.6 * HOUR, kind: "congestion", label: "Demand surge · Canary Wharf", severity: "warning", siteId: "CLN-G03" },
      { id: "e-h2", tMs: 1.8 * HOUR, kind: "congestion", label: "Cell load 92% · City of London", severity: "critical", siteId: "CLN-G02" },
      { id: "e-h3", tMs: 2.9 * HOUR, kind: "optimisation", label: "Load-balancing recommended", severity: "info" },
    ],
  },
  "major-event": {
    id: "major-event",
    label: "Major Event",
    description: "Stadium-scale crowd — localised hotspot, mutual-aid response.",
    seedDeactivated: [],
    durationMs: 5 * HOUR,
    synthetic: true,
    events: [
      { id: "e-m1", tMs: 1.0 * HOUR, kind: "alert", label: "Crowd density spike · Stratford corridor", severity: "warning" },
      { id: "e-m2", tMs: 2.4 * HOUR, kind: "failover", label: "Priority access enabled · ESN", severity: "info" },
      { id: "e-m3", tMs: 3.6 * HOUR, kind: "congestion", label: "Backhaul saturation · Shoreditch", severity: "critical", siteId: "CLN-G05" },
    ],
  },
  "infrastructure-loss": {
    id: "infrastructure-loss",
    label: "Infrastructure Loss",
    description: "Backhaul failure takes a hub offline — coverage hole opens.",
    seedDeactivated: ["CLN-G01"],
    durationMs: 3 * HOUR,
    synthetic: true,
    events: [
      { id: "e-i1", tMs: 0.3 * HOUR, kind: "alert", label: "Backhaul link down · Westminster", severity: "critical", siteId: "CLN-G01" },
      { id: "e-i2", tMs: 0.5 * HOUR, kind: "alert", label: "Coverage hole detected · SW1", severity: "critical" },
      { id: "e-i3", tMs: 1.2 * HOUR, kind: "agent", label: "Agent: root cause = backhaul", severity: "info" },
      { id: "e-i4", tMs: 1.6 * HOUR, kind: "failover", label: "Starlink failover proposed", severity: "info" },
    ],
  },
  "cyber-attack": {
    id: "cyber-attack",
    label: "Cyber Attack",
    description: "Coordinated signalling-storm against core sites.",
    seedDeactivated: ["CLN-G11"],
    durationMs: 3 * HOUR,
    synthetic: true,
    events: [
      { id: "e-c1", tMs: 0.4 * HOUR, kind: "alert", label: "Anomalous signalling · King's Cross", severity: "critical", siteId: "CLN-G11" },
      { id: "e-c2", tMs: 0.9 * HOUR, kind: "alert", label: "Auth flood detected", severity: "critical" },
      { id: "e-c3", tMs: 1.5 * HOUR, kind: "agent", label: "Agent: isolating affected APN", severity: "info" },
    ],
  },
  "power-outage": {
    id: "power-outage",
    label: "Power Outage",
    description: "Grid fault drops two sites to battery, then offline.",
    seedDeactivated: ["CLN-G08", "CLN-G14"],
    durationMs: 4 * HOUR,
    synthetic: true,
    events: [
      { id: "e-p1", tMs: 0.2 * HOUR, kind: "alert", label: "Mains fault · W2 feeder", severity: "critical" },
      { id: "e-p2", tMs: 0.8 * HOUR, kind: "alert", label: "Paddington on battery (42m)", severity: "warning", siteId: "CLN-G08" },
      { id: "e-p3", tMs: 1.9 * HOUR, kind: "failover", label: "Maida Vale offline", severity: "critical", siteId: "CLN-G14" },
    ],
  },
};

export const SCENARIO_ORDER: ScenarioId[] = [
  "live",
  "high-demand",
  "major-event",
  "infrastructure-loss",
  "cyber-attack",
  "power-outage",
];

export const DEFAULT_SCENARIO: ScenarioId = "live";
