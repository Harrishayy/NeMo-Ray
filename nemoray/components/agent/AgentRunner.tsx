"use client";

import { useStreamingAgent } from "@/hooks/useStreamingAgent";

/**
 * Invisible mount point for the global agent stream runner. The app shell
 * renders this exactly once so agent runs stream app-wide regardless of which
 * workspace is in view. Renders nothing.
 */
export function AgentRunner(): null {
  useStreamingAgent();
  return null;
}
