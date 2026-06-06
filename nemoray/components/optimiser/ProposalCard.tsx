"use client";

import { useState } from "react";
import {
  Check,
  MapPin,
  PoundSterling,
  RotateCcw,
  TrendingUp,
  X,
} from "lucide-react";
import { Button, Readout, StatusDot, type Status } from "@/components/primitives";
import { formatCompact } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";
import type { Proposal, ProposalStatus } from "@/lib/types";
import { ValidationVerdict } from "./ValidationVerdict";

const STATUS_META: Record<
  ProposalStatus,
  { label: string; dot: Status; pulse: boolean; text: string }
> = {
  proposed: { label: "Proposed", dot: "idle", pulse: false, text: "text-ink-dim" },
  validating: { label: "Validating", dot: "info", pulse: true, text: "text-info" },
  accepted: { label: "Accepted", dot: "nominal", pulse: false, text: "text-nv" },
  rejected: { label: "Rejected", dot: "critical", pulse: false, text: "text-critical" },
};

function fmtCost(gbp: number): string {
  return `£${formatCompact(gbp).toLowerCase()}`;
}

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const setProposalStatus = useNemoStore((s) => s.setProposalStatus);
  const selectedSiteId = useNemoStore((s) => s.selectedSiteId);
  const [overrideArmed, setOverrideArmed] = useState(false);

  const { status, validation } = proposal;
  const meta = STATUS_META[status];
  const selected = selectedSiteId === proposal.id;
  const accepted = status === "accepted";
  const decided = accepted || status === "rejected";
  const failsValidation = validation?.verdict === "fail";
  const [lng, lat] = proposal.position;

  // Accept is blocked when LiDAR/StreetView rejected the pick — unless the
  // planner explicitly arms an override.
  const acceptDisabled = failsValidation && !overrideArmed;

  const accept = () => setProposalStatus(proposal.id, "accepted");
  const reject = () => setProposalStatus(proposal.id, "rejected");
  const reset = () => {
    setOverrideArmed(false);
    setProposalStatus(proposal.id, "proposed");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border bg-panel-2/50 px-3 py-3 transition-colors",
        accepted && "nm-glow",
        selected
          ? "border-nv"
          : "border-hairline hover:border-nv/50",
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2">
        <MapPin
          size={14}
          className={cn("shrink-0", accepted ? "text-nv" : "text-ink-dim")}
        />
        <span className="truncate text-sm font-medium text-ink">{proposal.label}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <StatusDot status={meta.dot} pulse={meta.pulse} />
          <span className={cn("nm-eyebrow", meta.text)}>{meta.label}</span>
        </span>
      </div>

      {/* metrics */}
      <div className="flex items-end gap-5">
        <Readout
          label={
            <span className="inline-flex items-center gap-1">
              <TrendingUp size={10} className="text-nv" />
              Coverage gain
            </span>
          }
          value={`+${proposal.coverageGainPct.toFixed(1)}%`}
          valueClassName="text-nv"
        />
        <Readout
          label={
            <span className="inline-flex items-center gap-1">
              <PoundSterling size={10} className="text-ink-faint" />
              Est. cost
            </span>
          }
          value={fmtCost(proposal.estCostGbp)}
        />
        <Readout
          label="Lat / Lng"
          value={
            <span className="text-[11px] text-ink-dim">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          }
        />
      </div>

      {/* rationale */}
      <p className="text-xs leading-snug text-ink-dim">{proposal.rationale}</p>

      {/* Nemotron reality-check */}
      <ValidationVerdict validation={validation} />

      {/* actions */}
      {decided ? (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "nm-eyebrow flex items-center gap-1.5",
              accepted ? "text-nv" : "text-critical",
            )}
          >
            {accepted ? <Check size={12} /> : <X size={12} />}
            {accepted ? "Added to plan" : "Dismissed"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={reset}
          >
            <RotateCcw size={12} />
            Reset
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {acceptDisabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideArmed(true)}
              className="border-critical/40 text-critical hover:border-critical hover:text-critical"
              title="Validation failed — click to override the Nemotron verdict"
            >
              Override verdict
            </Button>
          ) : (
            <Button variant="solid" size="sm" onClick={accept}>
              <Check size={12} />
              {overrideArmed ? "Accept anyway" : "Accept"}
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={reject}>
            <X size={12} />
            Reject
          </Button>
          {overrideArmed && (
            <span className="nm-eyebrow ml-auto text-critical">Override armed</span>
          )}
        </div>
      )}
    </div>
  );
}
