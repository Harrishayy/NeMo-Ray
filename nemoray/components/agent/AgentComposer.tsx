"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { CornerDownLeft } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/primitives";
import { useStreamingAgent } from "@/hooks/useStreamingAgent";
import { useNemoStore } from "@/store";

/**
 * Bottom-pinned operator input for the agent console. Submits a prompt on Enter
 * or via the send button; disabled while a run is streaming. No mic button —
 * voice lives in a separate module.
 */
export function AgentComposer({ className }: { className?: string }) {
  const [value, setValue] = useState("");
  const streaming = useNemoStore((s) => s.streaming);
  const { sendPrompt } = useStreamingAgent();

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    sendPrompt(text);
    setValue("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !streaming;

  return (
    <div className={cn("shrink-0 border-t border-hairline bg-panel/60", className)}>
      <form onSubmit={onSubmit} className="flex items-center gap-2 px-2.5 py-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={streaming}
          placeholder={streaming ? "Agent is responding…" : "Ask the AI agent…"}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "min-w-0 flex-1 border border-hairline bg-bg px-2.5 py-1.5",
            "font-mono text-[12.5px] text-ink placeholder:text-ink-faint",
            "transition-colors focus:border-hairline-strong focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          variant="solid"
          size="md"
          disabled={!canSend}
          aria-label="Send to agent"
        >
          <CornerDownLeft size={13} />
          Send
        </Button>
      </form>

      <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
        <span
          className={cn(
            "h-1 w-1 rounded-full",
            streaming ? "animate-pulse-soft bg-info" : "bg-ink-faint",
          )}
        />
        <span className="eyebrow text-[9px] text-ink-faint">
          {streaming ? "Streaming · input locked" : "Enter to send"}
        </span>
      </div>
    </div>
  );
}
