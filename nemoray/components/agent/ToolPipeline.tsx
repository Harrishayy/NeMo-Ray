"use client";

import { cn } from "@/lib/cn";
import { Panel, PanelHeader, PanelBody } from "@/components/primitives";
import { useNemoStore } from "@/store";
import { ToolCard } from "./ToolCard";

const GHOST_SLOTS = ["DIAGNOSE", "ROOT CAUSE", "FAILOVER"] as const;
const MAX_VISIBLE = 6;

/**
 * The TOOL PIPELINE strip. Shows the most recent tool calls as animated cards;
 * before any run, three ghost slots keep the structure legible.
 */
export function ToolPipeline({ className }: { className?: string }) {
  const toolCalls = useNemoStore((s) => s.toolCalls);
  const recent = toolCalls.slice(-MAX_VISIBLE);
  const running = toolCalls.some((t) => t.status === "running");

  return (
    <Panel className={className}>
      <PanelHeader
        label="TOOL PIPELINE"
        right={
          <span
            className={cn(
              "nm-readout text-[9px] uppercase tracking-[0.12em]",
              running ? "text-info" : "text-ink-faint",
            )}
          >
            {running ? "EXECUTING" : `${toolCalls.length} CALLS`}
          </span>
        }
      />
      <PanelBody className="p-2">
        {recent.length === 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {GHOST_SLOTS.map((slot) => (
              <div
                key={slot}
                className="flex h-[52px] flex-col justify-center gap-1 border border-dashed border-hairline bg-bg/40 px-2.5"
              >
                <span className="nm-eyebrow text-[8px] text-ink-faint">SLOT</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  {slot}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((call) => (
              <ToolCard key={call.id} call={call} />
            ))}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
