import { AgentConsole } from "@/components/agent/AgentConsole";
import { ToolPipeline } from "@/components/agent/ToolPipeline";

/**
 * Right rail: the AI agent console over its tool pipeline. Voice lives inside
 * the console's composer — it's a way to talk to the agent, not a separate card.
 */
export function RightRail() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <AgentConsole className="min-h-0 flex-1" />
      <ToolPipeline className="shrink-0" />
    </div>
  );
}
