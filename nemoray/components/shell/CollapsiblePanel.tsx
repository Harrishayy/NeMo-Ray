"use client";

import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Side = "left" | "right" | "bottom";

const SPINE = 34;

/**
 * A rail/bar that collapses to a thin clickable spine. Left/right animate
 * width; bottom animates height. The map cell flexes to fill whatever's left.
 */
export function CollapsiblePanel({
  side,
  collapsed,
  onToggle,
  expandedSize,
  label,
  children,
  className,
}: {
  side: Side;
  collapsed: boolean;
  onToggle(): void;
  expandedSize: number;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const horizontal = side !== "bottom";
  const size = collapsed ? SPINE : expandedSize;

  const borderClass =
    side === "left"
      ? "border-r border-hairline"
      : side === "right"
        ? "border-l border-hairline"
        : "border-t border-hairline";

  const CollapseIcon =
    side === "left" ? ChevronLeft : side === "right" ? ChevronRight : ChevronDown;
  const ExpandIcon =
    side === "left" ? ChevronRight : side === "right" ? ChevronLeft : ChevronUp;

  return (
    <motion.div
      className={cn("relative shrink-0 overflow-hidden bg-bg-2/40", borderClass, className)}
      animate={horizontal ? { width: size } : { height: size }}
      initial={false}
      transition={{ type: "tween", duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      style={horizontal ? { height: "100%" } : { width: "100%" }}
    >
      {collapsed ? (
        <button
          onClick={onToggle}
          aria-label={`Expand ${label}`}
          className={cn(
            "group flex h-full w-full items-center justify-center gap-2 bg-bg-2/60 text-ink-faint transition-colors hover:bg-nv/[0.06] hover:text-nv",
            horizontal ? "flex-col py-3" : "flex-row",
          )}
        >
          <ExpandIcon size={14} className="shrink-0" />
          <span
            className="nm-eyebrow whitespace-nowrap group-hover:text-nv"
            style={horizontal ? { writingMode: "vertical-rl", transform: "rotate(180deg)" } : undefined}
          >
            {label}
          </span>
          <span
            className={cn(
              "bg-hairline-strong group-hover:bg-nv",
              horizontal ? "h-8 w-px" : "h-px w-8",
            )}
          />
        </button>
      ) : (
        <div
          className="relative h-full"
          style={horizontal ? { width: expandedSize } : { height: expandedSize }}
        >
          <button
            onClick={onToggle}
            aria-label={`Collapse ${label}`}
            className={cn(
              "absolute z-20 flex h-5 w-5 items-center justify-center border border-hairline bg-bg-2 text-ink-faint transition-colors hover:border-nv hover:text-nv",
              side === "left" && "right-1 top-1",
              side === "right" && "left-1 top-1",
              side === "bottom" && "right-1 top-1",
            )}
          >
            <CollapseIcon size={12} />
          </button>
          {children}
        </div>
      )}
    </motion.div>
  );
}
