"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RailTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

/**
 * A segmented tab strip that lives at the top of a rail, letting the operator
 * swap which panel that rail shows (e.g. Chat ↔ cuOpt). Mirrors the active-tab
 * corner-tick treatment of the old workspace tabs. `reserve` pads the side that
 * the CollapsiblePanel's collapse button floats over so tabs never sit under it.
 */
export function RailTabs<T extends string>({
  tabs,
  active,
  onSelect,
  reserve,
  className,
}: {
  tabs: RailTab<T>[];
  active: T;
  onSelect(id: T): void;
  reserve?: "left" | "right";
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex h-9 shrink-0 items-stretch gap-px border-b border-hairline bg-bg-2/60",
        reserve === "left" && "pl-7",
        reserve === "right" && "pr-7",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isActive}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors",
              isActive ? "text-nv" : "text-ink-dim hover:text-ink",
            )}
          >
            {isActive && (
              <>
                <span className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-nv" />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-nv" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-nv" />
                <span className="absolute inset-0 -z-10 bg-nv/[0.06]" />
              </>
            )}
            <Icon
              size={13}
              className={isActive ? "text-nv" : "text-ink-faint group-hover:text-ink-dim"}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
