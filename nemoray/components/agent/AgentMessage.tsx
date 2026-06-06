"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { StatusDot } from "@/components/primitives";
import type { AgentMessage as AgentMessageT } from "@/lib/types";

function ts(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** A faint, collapsible mono reasoning trace. */
function Reasoning({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-ink-faint transition-colors hover:text-ink-dim"
      >
        <ChevronRight
          size={11}
          className={cn("transition-transform", open && "rotate-90")}
        />
        <span className="eyebrow text-[9px]">reasoning</span>
      </button>
      {open && (
        <pre className="mt-1 whitespace-pre-wrap border-l border-hairline pl-2 font-mono text-[11px] leading-relaxed text-ink-faint">
          {text}
        </pre>
      )}
    </div>
  );
}

/** Render exactly one agent / operator / system message in the console. */
export function AgentMessage({ message }: { message: AgentMessageT }) {
  const { role, content, streaming, reasoning, createdAt } = message;
  const time = ts(createdAt);

  // ── operator: right-aligned, dim, mono prefix ──
  if (role === "operator") {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="max-w-[88%] border-r-2 border-hairline-strong bg-transparent py-0.5 pr-2.5 text-right">
          <p className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-ink-dim">
            <span className="text-nv-dim">OPR ▸ </span>
            {content}
          </p>
        </div>
        <span className="readout pr-2.5 text-[9px] text-ink-faint">{time}</span>
      </div>
    );
  }

  // ── system / error: full-width, critical-tinted mono ──
  if (role === "system") {
    return (
      <div className="border-l-2 border-critical bg-critical/5 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-[9px] text-critical">SYS</span>
          <span className="readout text-[9px] text-ink-faint">{time}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-critical/90">
          {content}
        </p>
      </div>
    );
  }

  // ── agent (Nemotron): left, accent bar + subtle surface ──
  return (
    <div className="border-l-2 border-nv/60 bg-surface/40 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <StatusDot status={streaming ? "info" : "nominal"} pulse={streaming} />
        <span className="eyebrow text-[9px] text-nv">NEMOTRON</span>
        <span className="readout ml-auto text-[9px] text-ink-faint">{time}</span>
      </div>

      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
        {content}
        {streaming && (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1.05em] w-[0.5ch] translate-y-[0.12em] animate-blink bg-nv align-baseline"
          />
        )}
      </p>

      {reasoning && <Reasoning text={reasoning} />}
    </div>
  );
}
