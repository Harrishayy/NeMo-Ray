import { AgentConsole } from "@/components/agent/AgentConsole";
import { ToolPipeline } from "@/components/agent/ToolPipeline";
import { WorkspaceSync } from "@/components/shell/WorkspaceSync";

/** AI Agent — a focused, larger console + tool pipeline over the map. */
export default function AgentPage() {
  return (
    <>
      <WorkspaceSync workspace="agent" />
      <div className="pointer-events-auto m-auto flex h-full w-[640px] max-w-full gap-2">
        <AgentConsole className="min-h-0 flex-1" />
        <div className="hidden w-[230px] shrink-0 lg:block">
          <ToolPipeline className="h-full" />
        </div>
      </div>
    </>
  );
}
