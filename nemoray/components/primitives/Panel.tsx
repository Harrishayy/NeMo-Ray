import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Framed mission-control panel. The base surface for every rail/console block.
 */
export function Panel({
  children,
  className,
  frame = false,
  scanlines = false,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  /** corner-tick HUD frame */
  frame?: boolean;
  scanlines?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col border border-hairline bg-panel/80",
        frame && "hud-frame",
        scanlines && "scanlines",
        glow && "glow-green",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Panel header: tracked eyebrow label on the left, optional actions on the right,
 * a hairline rule, and a small green accent tick.
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
        "flex h-9 shrink-0 items-center gap-2 border-b border-hairline px-3",
        className,
      )}
    >
      {accent && <span className="h-3 w-[2px] shrink-0 bg-nv shadow-[0_0_8px_var(--color-nv-glow)]" />}
      <span className="eyebrow truncate">{label}</span>
      {sub && <span className="eyebrow text-ink-faint truncate">{sub}</span>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

/** Scrollable body region inside a Panel. */
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
