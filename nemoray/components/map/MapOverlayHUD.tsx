"use client";

import { Power, X, Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/primitives";
import { useNemoStore, useSelectedSite } from "@/store";
import type { CoverageStatus } from "@/lib/types";

const STATUS_LABEL: Record<CoverageStatus, string> = {
  idle: "IDLE",
  computing: "RECOMPUTING",
  ready: "NOMINAL",
  error: "ERROR",
};

const STATUS_COLOR: Record<CoverageStatus, string> = {
  idle: "text-ink-faint",
  computing: "text-warning",
  ready: "text-nv",
  error: "text-critical",
};

/**
 * DOM overlay rendered ON TOP of the map stage (never inside its perspective
 * transform). Shows the selected-site callout + a live status chip.
 */
export function MapOverlayHUD() {
  const selected = useSelectedSite();
  const selectSite = useNemoStore((s) => s.selectSite);
  const deactivateSite = useNemoStore((s) => s.deactivateSite);
  const reactivateSite = useNemoStore((s) => s.reactivateSite);
  const coverageStatus = useNemoStore((s) => s.coverageStatus);
  const sites = useNemoStore((s) => s.sites);
  const radioMap = useNemoStore((s) => s.radioMap);

  const activeCount = sites.filter((s) => s.status === "active").length;
  const deadZones = radioMap?.deadZones.length ?? 0;

  return (
    <>
      {/* ── live status chip (top-right) ── */}
      <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-stretch border border-hairline bg-panel/85 backdrop-blur-sm">
        <ChipCell label="Status">
          <span className={cn("readout", STATUS_COLOR[coverageStatus])}>
            {STATUS_LABEL[coverageStatus]}
          </span>
        </ChipCell>
        <ChipCell label="Active">
          <span className="readout text-ink">
            {activeCount}
            <span className="text-ink-faint">/{sites.length}</span>
          </span>
        </ChipCell>
        <ChipCell label="Dead Zones" last>
          <span
            className={cn("readout", deadZones > 0 ? "text-critical" : "text-nv")}
          >
            {deadZones}
          </span>
        </ChipCell>
      </div>

      {/* ── selected-site callout (top-left) ── */}
      {selected && (
        <div className="pointer-events-auto absolute left-3 top-3 z-30 w-64 select-none">
          <div className="hud-frame relative border border-hairline-strong bg-panel/90 p-3 backdrop-blur-sm">
            {/* header */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="readout text-nv text-[13px]">{selected.id}</div>
                <div className="truncate text-sm text-ink">{selected.name}</div>
              </div>
              <button
                aria-label="Clear selection"
                onClick={() => selectSite(null)}
                className="-mr-1 -mt-1 shrink-0 p-1 text-ink-faint transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            {/* meta grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-hairline pt-2">
              <Field label="Operator" value={selected.operator} />
              <Field label="Band" value={selected.band} />
              <Field label="Height" value={selected.heightM} unit="m" />
              <Field label="Tx Power" value={selected.txPowerDbm} unit="dBm" />
              <Field
                label="Lat"
                value={selected.position[1].toFixed(4)}
              />
              <Field
                label="Lng"
                value={selected.position[0].toFixed(4)}
              />
            </div>

            {/* status row */}
            <div className="mt-2 flex items-center gap-1.5 border-t border-hairline pt-2">
              <span className="eyebrow text-ink-faint">State</span>
              <span
                className={cn(
                  "readout uppercase",
                  selected.status === "active"
                    ? "text-nv"
                    : selected.status === "failover"
                      ? "text-warning"
                      : "text-critical",
                )}
              >
                {selected.status}
              </span>
            </div>

            {/* primary action */}
            <div className="mt-2.5">
              {selected.status === "active" ? (
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => deactivateSite(selected.id)}
                >
                  <Power size={12} />
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="solid"
                  size="sm"
                  className="w-full"
                  onClick={() => reactivateSite(selected.id)}
                >
                  <Zap size={12} />
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChipCell({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-2.5 py-1.5",
        !last && "border-r border-hairline",
      )}
    >
      <span className="eyebrow text-[9px]">{label}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  unit,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow text-[9px]">{label}</span>
      <span className="readout text-ink">
        {value}
        {unit && <span className="ml-0.5 text-[0.8em] text-ink-dim">{unit}</span>}
      </span>
    </div>
  );
}
