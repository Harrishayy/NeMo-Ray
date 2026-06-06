"use client";

import {
  Activity,
  Check,
  Cpu,
  Network,
  Satellite,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { ToolCall, ToolName, ToolStatus } from "@/lib/types";

const ICON: Record<ToolName, LucideIcon> = {
  diagnose_site: Activity,
  predict_root_cause: Network,
  activate_failover: Satellite,
  run_cuopt: Cpu,
  validate_site: ShieldCheck,
};

const STATUS_TEXT: Record<ToolStatus, string> = {
  queued: "QUEUED",
  running: "RUNNING",
  success: "SUCCESS",
  error: "ERROR",
};

const STATUS_COLOR: Record<ToolStatus, string> = {
  queued: "text-ink-faint",
  running: "text-info",
  success: "text-nv",
  error: "text-critical",
};

/** One animated tool-pipeline cell. */
export function ToolCard({ call }: { call: ToolCall }) {
  const Icon = ICON[call.name];
  const { status, label, result, progress = 0 } = call;
  const active = status === "running" || status === "success";

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1.5 border bg-panel-2/70 px-2.5 py-2",
        status === "error" ? "border-critical/40" : "border-hairline",
        active && "nm-glow",
        status === "running" && "border-info/40",
        status === "success" && "border-nv/40",
      )}
    >
      {/* header: icon + label + status word */}
      <div className="flex items-center gap-1.5">
        <Icon
          size={13}
          className={cn(
            "shrink-0",
            status === "queued" && "text-ink-faint",
            status === "running" && "nm-pulse text-info",
            status === "success" && "text-nv",
            status === "error" && "text-critical",
          )}
        />
        <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink">
          {label}
        </span>
        <span
          className={cn(
            "nm-readout ml-auto flex shrink-0 items-center gap-0.5 text-[9px] uppercase tracking-[0.12em]",
            STATUS_COLOR[status],
            status === "running" && "nm-pulse",
          )}
        >
          {status === "success" && <Check size={10} />}
          {status === "error" && <X size={10} />}
          {STATUS_TEXT[status]}
        </span>
      </div>

      {/* progress bar / result */}
      {status === "queued" && (
        <div className="h-[3px] w-full overflow-hidden bg-bg">
          <div className="nm-shimmer h-full w-full" />
        </div>
      )}

      {status === "running" && (
        <div className="h-[3px] w-full overflow-hidden bg-bg">
          <div
            className="h-full bg-info shadow-[0_0_8px_var(--color-info)] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      )}

      {(status === "success" || status === "error") && result && (
        <p
          className={cn(
            "whitespace-pre-wrap font-mono text-[10.5px] leading-snug",
            status === "error" ? "text-critical/90" : "text-ink-dim",
          )}
        >
          {result}
        </p>
      )}
    </div>
  );
}
