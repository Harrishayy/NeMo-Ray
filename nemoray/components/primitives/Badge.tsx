import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "solid"
  | "nominal"
  | "warning"
  | "critical"
  | "info";

/**
 * Badge — a small rectangular label for states, counts and tags. `tone` maps to
 * the status palette; "solid" is the brand-green chip, "neutral" is the default.
 */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("nm-badge", tone !== "neutral" && `nm-badge--${tone}`, className)}
    >
      {children}
    </span>
  );
}
