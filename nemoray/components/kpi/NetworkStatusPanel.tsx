"use client";

import { useMemo } from "react";

import { useNemoStore } from "@/store";
import { Panel, PanelHeader, PanelBody, StatusDot, type Status } from "@/components/primitives";
import { cn } from "@/lib/cn";

const COVERAGE_STATUS = {
  ready: { dot: "nominal", label: "LIVE", pulse: true },
  computing: { dot: "info", label: "SYNC", pulse: true },
  idle: { dot: "idle", label: "IDLE", pulse: false },
  error: { dot: "critical", label: "FAULT", pulse: true },
} as const;

/**
 * Left-rail network status. Reports the real fleet — how many ESN cell towers
 * are monitored across London and how many are currently on air. No synthetic
 * subscriber or congestion figures.
 */
export function NetworkStatusPanel({ className }: { className?: string }) {
  const coverageStatus = useNemoStore((s) => s.coverageStatus);
  const sites = useNemoStore((s) => s.sites);
  const radioMap = useNemoStore((s) => s.radioMap);
  const s = COVERAGE_STATUS[coverageStatus];

  const { total, online, offline, esn, ee } = useMemo(() => {
    const on = sites.filter((x) => x.status === "active").length;
    return {
      total: sites.length,
      online: on,
      offline: sites.length - on,
      esn: sites.filter((x) => x.operator === "ESN").length,
      ee: sites.filter((x) => x.operator === "EE").length,
    };
  }, [sites]);

  const criticalGaps =
    radioMap?.deadZones.filter((d) => d.severity === "critical").length ?? 0;

  return (
    <Panel className={cn("@container", className)}>
      <PanelHeader
        label="Network Status"
        sub="LONDON · ESN"
        right={
          <span className="flex items-center gap-1.5">
            <StatusDot status={s.dot} pulse={s.pulse} />
            <span className="nm-eyebrow text-ink-dim">{s.label}</span>
          </span>
        }
      />
      <PanelBody className="flex flex-col gap-3 overflow-y-visible p-3">
        {/* Headline — total cell towers monitored */}
        <div className="flex flex-col gap-1">
          <span className="nm-eyebrow text-ink-faint">Cell Towers</span>
          <div className="flex items-baseline gap-2">
            <span className="nm-readout text-4xl leading-none tracking-tight text-ink tabular-nums">
              {total}
            </span>
            <span className="text-[11px] leading-tight text-ink-faint">
              sites monitored
            </span>
          </div>
        </div>

        {/* On-air / offline split */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="On air" value={online} status="nominal" />
          <StatTile
            label="Offline"
            value={offline}
            status={offline > 0 ? "critical" : "idle"}
          />
        </div>

        {/* Operator breakdown — real per-network counts */}
        <div className="flex items-center justify-between border-t border-hairline pt-2.5">
          <OperatorChip label="ESN" count={esn} />
          <OperatorChip label="EE" count={ee} />
        </div>

        {/* Critical coverage gaps from the live radio map */}
        <div className="flex items-center justify-between border-t border-hairline pt-2.5">
          <span className="nm-eyebrow text-ink-faint">Critical coverage gaps</span>
          <span
            className={cn(
              "nm-readout text-sm tabular-nums",
              criticalGaps > 0 ? "text-critical" : "text-ink-dim",
            )}
          >
            {criticalGaps}
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
}

const TILE_ACCENT: Record<Status, string> = {
  nominal: "border-l-nominal text-nominal",
  warning: "border-l-warning text-warning",
  critical: "border-l-critical text-critical",
  info: "border-l-info text-info",
  idle: "border-l-hairline-strong text-ink-dim",
};

/** A single bordered count tile (on-air / offline). */
function StatTile({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: Status;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border border-hairline border-l-2 bg-bg/40 px-2.5 py-2",
        TILE_ACCENT[status],
      )}
    >
      <span className="nm-eyebrow text-ink-faint">{label}</span>
      <span className="nm-readout text-2xl leading-none tracking-tight tabular-nums">
        {value}
      </span>
    </div>
  );
}

/** Compact operator readout — name beside count. */
function OperatorChip({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="nm-eyebrow text-ink-dim">{label}</span>
      <span className="nm-readout text-sm text-ink tabular-nums">{count}</span>
    </div>
  );
}
