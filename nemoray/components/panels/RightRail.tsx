"use client";

import { MessageSquare, Target } from "lucide-react";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { ToolPipeline } from "@/components/agent/ToolPipeline";
import { ProposalList } from "@/components/optimiser/ProposalList";
import { RailTabs, type RailTab } from "@/components/shell/RailTabs";
import type { RightRailTab } from "@/lib/types";
import { useNemoStore, useRightRailTab } from "@/store";

const TABS: RailTab<RightRailTab>[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "cuopt", label: "cuOpt", icon: Target },
];

/**
 * Right (action) rail: swaps between the AI agent console (+ tool pipeline) and
 * the cuOpt proposal list.
 */
export function RightRail() {
  const tab = useRightRailTab();
  const setTab = useNemoStore((s) => s.setRightRailTab);

  return (
    <div className="flex h-full flex-col">
      <RailTabs tabs={TABS} active={tab} onSelect={setTab} reserve="left" />
      <div className="min-h-0 flex-1 p-2">
        {tab === "chat" ? (
          <div className="flex h-full flex-col gap-2">
            <AgentConsole className="min-h-0 flex-1" />
            <ToolPipeline className="shrink-0" />
          </div>
        ) : (
          <ProposalList className="h-full" />
        )}
      </div>
    </div>
  );
}
