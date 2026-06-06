import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A labelled mono numeric readout — label above, value below. */
export function Readout({
  label,
  value,
  unit,
  className,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="eyebrow">{label}</span>
      <span className={cn("readout text-ink", valueClassName)}>
        {value}
        {unit && <span className="ml-1 text-ink-dim text-[0.75em]">{unit}</span>}
      </span>
    </div>
  );
}

/** Compact-format a number (e.g. 1.23M, 168K). */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}
