"use client";

import { Activity, Radio } from "lucide-react";
import { NetworkStatusPanel } from "@/components/kpi/NetworkStatusPanel";
import { MapLayersPanel } from "@/components/layers/MapLayersPanel";
import { ScenarioDetail } from "@/components/scenario/ScenarioDetail";
import { RailTabs, type RailTab } from "@/components/shell/RailTabs";
import type { LeftRailTab } from "@/lib/types";
import { useLeftRailTab, useNemoStore } from "@/store";

const TABS: RailTab<LeftRailTab>[] = [
  { id: "network", label: "Network", icon: Activity },
  { id: "scenarios", label: "Scenarios", icon: Radio },
];

/** Left (context) rail: swaps between live network KPIs + layers and scenarios. */
export function LeftRail() {
  const tab = useLeftRailTab();
  const setTab = useNemoStore((s) => s.setLeftRailTab);

  return (
    <div className="flex h-full flex-col">
      <RailTabs tabs={TABS} active={tab} onSelect={setTab} reserve="right" />
      <div className="min-h-0 flex-1 p-2">
        {tab === "network" ? (
          <div className="flex h-full flex-col gap-2">
            <NetworkStatusPanel className="min-h-0 flex-1" />
            <MapLayersPanel className="shrink-0" />
          </div>
        ) : (
          <ScenarioDetail className="h-full" />
        )}
      </div>
    </div>
  );
}
