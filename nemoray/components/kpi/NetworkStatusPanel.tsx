"use client";

import { useNemoStore } from "@/store";
import { Panel, PanelHeader, PanelBody, StatusDot } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { KpiGrid } from "./KpiGrid";

const COVERAGE_STATUS = {
  ready: { dot: "nominal", label: "LIVE", pulse: true },
  computing: { dot: "info", label: "SYNC", pulse: true },
  idle: { dot: "idle", label: "IDLE", pulse: false },
  error: { dot: "critical", label: "FAULT", pulse: true },
} as const;

/** Drop-in left-rail panel: network status KPIs under a framed header. */
export function NetworkStatusPanel({ className }: { className?: string }) {
  const coverageStatus = useNemoStore((s) => s.coverageStatus);
  const s = COVERAGE_STATUS[coverageStatus];

  return (
    <Panel className={cn("@container", className)}>
      <PanelHeader
        label="Network Status"
        right={
          <span className="flex items-center gap-1.5">
            <StatusDot status={s.dot} pulse={s.pulse} />
            <span className="eyebrow text-ink-dim">{s.label}</span>
          </span>
        }
      />
      <PanelBody className="p-2">
        <KpiGrid />
      </PanelBody>
    </Panel>
  );
}
