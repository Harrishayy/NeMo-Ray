"use client";

import { Cpu, Inbox } from "lucide-react";
import {
  Button,
  Panel,
  PanelBody,
  PanelHeader,
  Readout,
} from "@/components/primitives";
import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";
import { ProposalCard } from "./ProposalCard";

export function ProposalList({ className }: { className?: string }) {
  const proposals = useNemoStore((s) => s.proposals);
  const requestAgentRun = useNemoStore((s) => s.requestAgentRun);

  const proposedCount = proposals.filter((p) => p.status === "proposed").length;
  const accepted = proposals.filter((p) => p.status === "accepted");
  const projectedGain = accepted.reduce((sum, p) => sum + p.coverageGainPct, 0);

  const runCuopt = () => requestAgentRun({ prompt: "run cuopt" });

  return (
    <Panel className={cn("h-full", className)}>
      <PanelHeader
        label="cuOpt Optimiser"
        sub="Mast Placement"
        right={
          <Button variant="outline" size="sm" onClick={runCuopt}>
            <Cpu size={12} />
            Run cuOpt
          </Button>
        }
      />

      {/* summary strip */}
      <div className="flex shrink-0 items-end gap-6 border-b border-hairline bg-surface/30 px-3 py-2.5">
        <Readout label="Proposed" value={proposedCount} />
        <Readout
          label="Accepted"
          value={accepted.length}
          valueClassName={accepted.length > 0 ? "text-nv" : undefined}
        />
        <Readout
          label="Projected gain"
          value={`+${projectedGain.toFixed(1)}%`}
          valueClassName="text-nv"
        />
        <Readout label="Candidates" value={proposals.length} className="ml-auto" />
      </div>

      <PanelBody className="flex flex-col gap-2.5 p-2.5">
        {proposals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox size={20} className="text-ink-faint" />
            <span className="nm-eyebrow text-ink-faint">No proposals</span>
            <span className="max-w-[220px] text-xs text-ink-dim">
              Run cuOpt to generate candidate mast sites for the active scenario.
            </span>
          </div>
        ) : (
          proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)
        )}
      </PanelBody>
    </Panel>
  );
}
