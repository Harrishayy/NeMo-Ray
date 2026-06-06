"use client";

import {
  AlertTriangle,
  Activity,
  GitBranch,
  Radio,
  ShieldAlert,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Panel, PanelHeader, PanelBody, StatusDot } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";
import type { EventKind } from "@/lib/types";

const KIND_ICON: Record<EventKind, LucideIcon> = {
  alert: AlertTriangle,
  failover: Zap,
  congestion: Activity,
  optimisation: GitBranch,
  agent: Radio,
  info: ShieldAlert,
};

const KIND_STATUS: Record<EventKind, "nominal" | "warning" | "critical" | "info" | "idle"> = {
  alert: "critical",
  failover: "nominal",
  congestion: "warning",
  optimisation: "nominal",
  agent: "info",
  info: "idle",
};

function fmtTime(tMs: number): string {
  const totalMin = Math.floor(tMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Scenarios workspace overlay: active scenario summary + its event track. */
export function ScenarioDetail({ className }: { className?: string }) {
  const scenarioId = useNemoStore((s) => s.activeScenarioId);
  const scenario = useNemoStore((s) => s.scenarios[scenarioId]);
  const deactivated = useNemoStore((s) => s.deactivatedSiteIds);

  return (
    <Panel frame className={cn("bg-panel/90", className)}>
      <PanelHeader
        label="SCENARIO BRIEF"
        sub={scenario.synthetic ? "SYNTHETIC" : "LIVE FEED"}
        right={<StatusDot status={scenario.synthetic ? "warning" : "nominal"} pulse />}
      />
      <PanelBody className="flex flex-col gap-4 p-3">
        <div>
          <div className="text-lg font-semibold uppercase tracking-[0.14em] text-nv">
            {scenario.label}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-dim">{scenario.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="border border-hairline bg-bg/50 p-2">
            <div className="nm-eyebrow">Sites Offline</div>
            <div className="nm-readout mt-0.5 text-xl text-ink">
              {deactivated.length}
            </div>
          </div>
          <div className="border border-hairline bg-bg/50 p-2">
            <div className="nm-eyebrow">Logged Events</div>
            <div className="nm-readout mt-0.5 text-xl text-ink">{scenario.events.length}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="nm-eyebrow mb-1">Event Track</div>
          {scenario.events.length === 0 && (
            <div className="border border-hairline bg-bg/40 px-2 py-3 text-center text-xs text-ink-faint">
              No events — nominal operations.
            </div>
          )}
          {scenario.events.map((ev) => {
            const Icon = KIND_ICON[ev.kind];
            return (
              <div
                key={ev.id}
                className="flex items-center gap-2.5 border-l-2 border-hairline-strong bg-surface/40 py-1.5 pl-2.5 pr-2"
              >
                <span className="nm-readout text-[11px] text-ink-faint">{fmtTime(ev.tMs)}</span>
                <Icon size={13} className="shrink-0 text-ink-dim" />
                <span className="flex-1 truncate text-xs text-ink">{ev.label}</span>
                <StatusDot status={KIND_STATUS[ev.kind]} />
              </div>
            );
          })}
        </div>
      </PanelBody>
    </Panel>
  );
}
