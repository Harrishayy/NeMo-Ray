"use client";

import { EventTimeline } from "@/components/scenario/EventTimeline";
import { ScenarioTabs } from "@/components/scenario/ScenarioTabs";
import { cn } from "@/lib/cn";

/**
 * The single bottom-bar block: the event-timeline scrubber stacked over the
 * scenario selector, each labelled with an eyebrow. The shell drops this into
 * the bottom-bar region.
 */
export function BottomBarContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col border-t border-hairline-strong bg-panel/80 backdrop-blur-sm",
        className,
      )}
    >
      {/* ── event timeline row ── */}
      <div className="flex items-start gap-3 px-3 py-2">
        <span className="nm-eyebrow mt-1 w-[88px] shrink-0 leading-[1.4]">Event Timeline</span>
        <EventTimeline className="min-w-0 flex-1" />
      </div>

      <div className="h-px bg-hairline" />

      {/* ── scenarios row ── */}
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="nm-eyebrow w-[88px] shrink-0">Scenarios</span>
        <ScenarioTabs className="min-w-0 flex-1" />
      </div>
    </div>
  );
}
