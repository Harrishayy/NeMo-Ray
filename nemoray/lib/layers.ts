import type { LayerId, LayerState } from "@/lib/types";

export interface LayerMeta {
  id: LayerId;
  label: string;
  hint: string;
}

/** Map-layer toggles shown in the left rail (order matters). */
export const LAYER_META: LayerMeta[] = [
  { id: "radioMap", label: "Bandwidth Streams", hint: "Sionna RT coverage / downlink heatmap" },
  { id: "sites", label: "Site Locations", hint: "Cell tower positions" },
  { id: "beams", label: "Coverage Beams", hint: "Per-site emission shafts" },
  { id: "arcs", label: "User Density", hint: "Subscriber load arcs" },
  { id: "backhaul", label: "Backhaul Links", hint: "Inter-site backhaul" },
  { id: "deadzone", label: "Dead Zones", hint: "Coverage holes" },
  { id: "labels", label: "Labels", hint: "Site & boundary labels" },
];

export const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
  radioMap: { visible: true, opacity: 0.85 },
  sites: { visible: true, opacity: 1 },
  beams: { visible: true, opacity: 0.9 },
  arcs: { visible: true, opacity: 0.7 },
  backhaul: { visible: false, opacity: 0.6 },
  deadzone: { visible: true, opacity: 1 },
  labels: { visible: true, opacity: 1 },
};
