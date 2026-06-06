"use client";

import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button, Panel, PanelHeader, PanelBody, StatusDot } from "@/components/primitives";
import { useStreamingAgent } from "@/hooks/useStreamingAgent";
import { useNemoStore } from "@/store";
import { AgentMessage } from "./AgentMessage";
import { AgentComposer } from "./AgentComposer";

const EXAMPLES = [
  "Assess coverage gaps",
  "Run cuOpt for infill masts",
  "Network status",
] as const;

/**
 * The AI AGENT CONSOLE — a streaming Nemotron transcript with operator input.
 * Auto-scrolls to the newest content as tokens arrive.
 */
export function AgentConsole({ className }: { className?: string }) {
  const messages = useNemoStore((s) => s.messages);
  const streaming = useNemoStore((s) => s.streaming);
  const resetConversation = useNemoStore((s) => s.resetConversation);
  const { sendPrompt } = useStreamingAgent();

  const endRef = useRef<HTMLDivElement | null>(null);

  // Track the streamed character count so token appends re-trigger the scroll.
  const charCount = messages.reduce((n, m) => n + m.content.length, 0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, charCount]);

  return (
    <Panel className={cn("min-h-0", className)}>
      <PanelHeader
        label="MISSION ASSISTANT"
        sub="POWERED BY NVIDIA NEMOTRON"
        right={
          <>
            <StatusDot status={streaming ? "info" : "nominal"} pulse={streaming} />
            <span className="readout text-[9px] uppercase tracking-[0.12em] text-ink-faint">
              {streaming ? "LIVE" : "READY"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              disabled={messages.length === 0}
              aria-label="Reset conversation"
            >
              <RotateCcw size={11} />
              Reset
            </Button>
          </>
        }
      />

      <PanelBody className="flex flex-col gap-2 p-2.5">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <StatusDot status="nominal" />
            <p className="eyebrow text-ink-dim">Awaiting operator command</p>
            <p className="max-w-[18rem] text-[12px] leading-relaxed text-ink-faint">
              Ask the Nemotron agent to diagnose a site, assess coverage, or run
              the cuOpt optimiser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => sendPrompt(ex)}
                  className={cn(
                    "border border-hairline bg-bg/60 px-2 py-1",
                    "font-mono text-[10.5px] text-ink-dim",
                    "transition-colors hover:border-nv hover:text-nv",
                  )}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <AgentMessage key={m.id} message={m} />)
        )}
        <div ref={endRef} />
      </PanelBody>

      <AgentComposer />
    </Panel>
  );
}
