import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

type Direction = "up" | "down" | "flat";

/**
 * Compact delta chip — arrow + signed % (abs, 1 decimal).
 * "Good" is up by default; `invert` flips it (e.g. congested cells, alerts —
 * an upward move is bad). Flat is always neutral.
 */
export function Delta({
  value,
  direction = "flat",
  invert = false,
}: {
  value?: number;
  direction?: Direction;
  invert?: boolean;
}) {
  if (value === undefined) return null;

  const Icon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  const tone =
    direction === "flat"
      ? "neutral"
      : (direction === "up") !== invert
        ? "good"
        : "bad";

  const color =
    tone === "good"
      ? "text-nv"
      : tone === "bad"
        ? "text-critical"
        : "text-ink-dim";

  return (
    <span
      className={cn(
        "readout inline-flex items-center gap-0.5 text-[11px] leading-none",
        color,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
