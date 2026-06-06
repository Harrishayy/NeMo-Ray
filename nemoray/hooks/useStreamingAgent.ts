"use client";

import { useCallback, useEffect, useRef } from "react";

import { openAgentStream } from "@/lib/api/agent";
import { useNemoStore } from "@/store";

/**
 * The GLOBAL agent runner. Mount this ONCE (via {@link AgentRunner}).
 *
 * Subscribes to `agentTrigger` ({ req, nonce }); whenever the nonce changes it
 * opens a fresh SSE stream and pipes every parsed event into the store via
 * `applyStreamEvent`. Any in-flight run is aborted before a new one starts, and
 * the trigger is cleared as soon as the new run begins.
 *
 * Also returns `sendPrompt(text)` so the composer can push an operator message
 * and kick off a run in one call.
 */
export function useStreamingAgent(): { sendPrompt: (text: string) => void } {
  const trigger = useNemoStore((s) => s.agentTrigger);
  const clearAgentTrigger = useNemoStore((s) => s.clearAgentTrigger);
  const applyStreamEvent = useNemoStore((s) => s.applyStreamEvent);
  const addOperatorMessage = useNemoStore((s) => s.addOperatorMessage);
  const requestAgentRun = useNemoStore((s) => s.requestAgentRun);

  const abortRef = useRef<AbortController | null>(null);
  // Guard against double-firing the same nonce (StrictMode double-effect, etc.).
  const lastNonceRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    if (trigger.nonce === lastNonceRef.current) return;
    lastNonceRef.current = trigger.nonce;

    const { req } = trigger;
    // Consume the trigger immediately so re-renders don't re-fire it.
    clearAgentTrigger();

    // Abort any run already in flight before starting a new one.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    openAgentStream(req, applyStreamEvent, controller.signal).catch(
      (err: unknown) => {
        if (controller.signal.aborted) return;
        applyStreamEvent({
          type: "error",
          message: err instanceof Error ? err.message : "Agent stream failed",
        });
      },
    );
  }, [trigger, clearAgentTrigger, applyStreamEvent]);

  // Abort the live stream when the runner unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendPrompt = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      addOperatorMessage(trimmed);
      requestAgentRun({ prompt: trimmed });
    },
    [addOperatorMessage, requestAgentRun],
  );

  return { sendPrompt };
}
