import type { KPI, KpiState } from "@/lib/types";
import { StatusDot, formatCompact } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

const ACCENT: Record<KpiState, string> = {
  nominal: "bg-nv shadow-[0_0_8px_var(--color-nv-glow)]",
  warning: "bg-warning shadow-[0_0_8px_var(--color-warning)]",
  critical: "bg-critical shadow-[0_0_8px_var(--color-critical)]",
};

/** Format the headline number per the KPI's format hint. */
function formatValue(kpi: KPI): string {
  switch (kpi.format) {
    case "compact":
      return formatCompact(kpi.value);
    case "decimal1":
      return kpi.value.toFixed(1);
    case "percent1":
      return kpi.value.toFixed(1);
    case "int":
    default:
      return Math.round(kpi.value).toLocaleString("en-GB");
  }
}

/** One telemetry stat: label + status, headline value, delta, sparkline. */
export function KpiCard({ kpi }: { kpi: KPI }) {
  const critical = kpi.state === "critical";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden border border-hairline bg-panel/60 px-3 py-2.5 pl-3.5 transition-colors",
        "hover:border-hairline-strong",
        critical && "bg-critical/[0.04] hover:border-critical/40",
      )}
    >
      {/* left status accent bar */}
      <span
        className={cn("absolute inset-y-0 left-0 w-[2px]", ACCENT[kpi.state])}
        aria-hidden
      />

      {/* label + status */}
      <div className="flex items-center gap-2">
        <span className="eyebrow truncate">{kpi.label}</span>
        <StatusDot
          status={kpi.state}
          pulse={critical}
          className="ml-auto"
        />
      </div>

      {/* headline value */}
      <div className="flex items-baseline gap-1.5">
        <span className="readout text-2xl leading-none tracking-tight text-ink text-glow">
          {formatValue(kpi)}
        </span>
        {kpi.format === "percent1" && kpi.unit && (
          <span className="readout text-sm leading-none text-ink-dim">{kpi.unit}</span>
        )}
        {kpi.unit && kpi.format !== "percent1" && (
          <span className="readout text-[11px] leading-none text-ink-dim">{kpi.unit}</span>
        )}
        {kpi.suffix && (
          <span className="readout text-[11px] leading-none text-ink-faint">{kpi.suffix}</span>
        )}
        <span className="ml-auto self-center">
          <Delta value={kpi.delta} direction={kpi.deltaDirection} invert={kpi.invertDelta} />
        </span>
      </div>

      {/* sparkline */}
      <Sparkline
        data={kpi.series}
        state={kpi.state}
        height={32}
        className="-mb-0.5 mt-0.5"
      />
    </div>
  );
}
