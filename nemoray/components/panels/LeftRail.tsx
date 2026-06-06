import { NetworkStatusPanel } from "@/components/kpi/NetworkStatusPanel";
import { MapLayersPanel } from "@/components/layers/MapLayersPanel";

/** Left rail: live network KPIs over the map-layer toggles. */
export function LeftRail() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <NetworkStatusPanel className="min-h-0 flex-1" />
      <MapLayersPanel className="shrink-0" />
    </div>
  );
}
