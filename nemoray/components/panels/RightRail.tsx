import { AgentConsole } from "@/components/agent/AgentConsole";
import { ToolPipeline } from "@/components/agent/ToolPipeline";
import { VoiceControl } from "@/components/agent/VoiceControl";

/** Right rail: the AI agent console, its tool pipeline, and the voice link. */
export function RightRail() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <AgentConsole className="min-h-0 flex-1" />
      <ToolPipeline className="shrink-0" />
      <VoiceControl className="shrink-0" />
    </div>
  );
}
