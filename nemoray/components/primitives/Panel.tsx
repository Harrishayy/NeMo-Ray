import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Mission-control panel — a soft-rounded slate card, the base surface for every
 * rail/console block. The legacy `frame`/`scanlines` props are accepted but are
 * now no-ops (the de-robotised system drops corner-ticks and scanlines); `glow`
 * maps to the soft accent ring used for the active state.
 */
export function Panel({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  /** legacy corner-tick frame — accepted for compatibility, no longer rendered */
  frame?: boolean;
  /** legacy CRT scanlines — accepted for compatibility, no longer rendered */
  scanlines?: boolean;
  /** soft accent ring (active state) */
  glow?: boolean;
}) {
  return (
    <div className={cn("nm-card-root", glow && "nm-card-root--active", className)}>
      {children}
    </div>
  );
}

/**
 * Panel header: a small green accent tick, a tracked eyebrow label, optional
 * secondary label and right-aligned actions, with a hairline rule below.
 */
export function PanelHeader({
  label,
  sub,
  right,
  accent = true,
  className,
}: {
  label: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-2.5 border-b border-[var(--line-subtle)] px-3",
        className,
      )}
    >
      {accent && <span className="nm-card-tick" />}
      <span className="nm-eyebrow truncate">{label}</span>
      {sub && <span className="nm-eyebrow truncate text-ink-faint">{sub}</span>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

/** Scrollable body region inside a Panel. Padding is left to the consumer. */
export function PanelBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>{children}</div>
  );
}
