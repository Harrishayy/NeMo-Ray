import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Proposal } from "@/lib/types";

/**
 * The Nemotron reality-check verdict — the product's signature insight.
 *
 * cuOpt proposes a spacing-optimal mast; Nemotron then cross-checks the pick
 * against real-world LiDAR / StreetView before a planner is allowed to trust
 * it. This row renders that verdict (or its pending state).
 */
export function ValidationVerdict({
  validation,
  className,
}: {
  validation: Proposal["validation"];
  className?: string;
}) {
  if (!validation) {
    return (
      <div
        className={cn(
          "relative flex items-center gap-2 overflow-hidden border border-hairline bg-surface/40 px-2.5 py-2",
          className,
        )}
      >
        <span className="shimmer absolute inset-0 opacity-40" aria-hidden />
        <span className="h-2 w-2 shrink-0 rounded-full bg-info/60 animate-pulse-soft" />
        <span className="eyebrow text-ink-faint">Awaiting Nemotron validation</span>
      </div>
    );
  }

  const pass = validation.verdict === "pass";
  const Icon = pass ? ShieldCheck : ShieldAlert;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 border px-2.5 py-2",
        pass
          ? "border-nv/35 bg-nv/[0.06]"
          : "border-critical/40 bg-critical/[0.06]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          className={cn("shrink-0", pass ? "text-nv" : "text-critical")}
        />
        <span
          className={cn(
            "eyebrow",
            pass ? "text-nv-bright" : "text-critical",
          )}
        >
          {pass ? "Nemotron · Validated" : "Nemotron · Rejected"}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="readout text-[10px] uppercase tracking-[0.12em] text-ink-faint">
            {validation.source}
          </span>
          <span
            className={cn(
              "readout px-1.5 py-px text-[10px] uppercase tracking-[0.14em]",
              pass
                ? "border border-nv/40 text-nv"
                : "border border-critical/50 text-critical",
            )}
          >
            {validation.verdict}
          </span>
        </span>
      </div>
      <p className="text-xs leading-snug text-ink-dim">{validation.reason}</p>
    </div>
  );
}
