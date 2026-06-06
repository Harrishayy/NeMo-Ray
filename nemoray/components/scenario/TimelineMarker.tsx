import { Tooltip } from "@/components/primitives";
import { cn } from "@/lib/cn";
import type { EventKind, EventMarker } from "@/lib/types";

/** mm:ss-aware HH:MM formatter from a millisecond offset on the timeline. */
function formatClock(tMs: number): string {
  const total = Math.max(0, Math.floor(tMs / 60_000));
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Marker colour, keyed first by severity then by event kind. */
function markerColor(kind: EventKind, severity?: EventMarker["severity"]): string {
  if (severity === "critical") return "var(--color-critical)";
  if (kind === "alert") return "var(--color-critical)";
  if (kind === "congestion") return "var(--color-warning)";
  if (kind === "failover" || kind === "optimisation") return "var(--color-nv)";
  if (kind === "agent") return "var(--color-info)";
  if (severity === "warning") return "var(--color-warning)";
  return "var(--color-ink-dim)";
}

/** A single event tick on the scrubber, absolutely positioned at `leftPct%`. */
export function TimelineMarker({
  event,
  leftPct,
}: {
  event: EventMarker;
  leftPct: number;
}) {
  const color = markerColor(event.kind, event.severity);

  return (
    <Tooltip
      side="top"
      content={
        <div className="flex items-start gap-2">
          <span className="readout shrink-0 text-nv-bright">{formatClock(event.tMs)}</span>
          <span className="text-ink-dim">{event.label}</span>
        </div>
      }
    >
      <button
        type="button"
        aria-label={`${formatClock(event.tMs)} — ${event.label}`}
        className={cn(
          "group absolute bottom-0 z-10 flex h-full -translate-x-1/2 flex-col items-center justify-end",
          "outline-none",
        )}
        style={{ left: `${leftPct}%` }}
      >
        {/* vertical stem */}
        <span
          className="w-px flex-1 opacity-40 transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: color }}
        />
        {/* diamond head */}
        <span
          className={cn(
            "block h-[7px] w-[7px] rotate-45 transition-transform duration-150",
            "group-hover:scale-150 group-focus-visible:scale-150",
          )}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </button>
    </Tooltip>
  );
}
