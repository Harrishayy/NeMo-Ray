"use client";

import type { ReactNode } from "react";
import { MapMount } from "@/components/map/MapMount";
import { AgentRunner } from "@/components/agent/AgentRunner";
import { LeftRail } from "@/components/panels/LeftRail";
import { RightRail } from "@/components/panels/RightRail";
import { BottomBar } from "@/components/panels/BottomBar";
import { TooltipProvider } from "@/components/primitives";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNemoStore } from "@/store";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { TopBar } from "./TopBar";
import { WorkspaceTabs } from "./WorkspaceTabs";

/**
 * The mission-control shell. A fixed, non-scrolling instrument: top bar +
 * workspace tabs over a middle row (collapsible left rail · persistent map ·
 * collapsible right rail) above a collapsible bottom bar. `children` overlay on
 * top of the always-mounted map per workspace.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const panels = useNemoStore((s) => s.panels);
  const togglePanel = useNemoStore((s) => s.togglePanel);
  useKeyboardShortcuts();

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <TopBar />
        <WorkspaceTabs />

        {/* middle row */}
        <div className="flex min-h-0 flex-1">
          <CollapsiblePanel
            side="left"
            label="Network"
            collapsed={panels.left}
            onToggle={() => togglePanel("left")}
            expandedSize={320}
          >
            <LeftRail />
          </CollapsiblePanel>

          <main className="relative min-w-0 flex-1 overflow-hidden">
            <MapMount className="absolute inset-0" />
            {/* per-workspace overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 flex p-3">
              {children}
            </div>
          </main>

          <CollapsiblePanel
            side="right"
            label="AI Agent"
            collapsed={panels.right}
            onToggle={() => togglePanel("right")}
            expandedSize={372}
          >
            <RightRail />
          </CollapsiblePanel>
        </div>

        {/* bottom bar */}
        <CollapsiblePanel
          side="bottom"
          label="Timeline · Scenarios"
          collapsed={panels.bottom}
          onToggle={() => togglePanel("bottom")}
          expandedSize={150}
        >
          <BottomBar />
        </CollapsiblePanel>

        <AgentRunner />
      </div>
    </TooltipProvider>
  );
}
