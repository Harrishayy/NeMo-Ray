import { ScenarioDetail } from "@/components/scenario/ScenarioDetail";
import { WorkspaceSync } from "@/components/shell/WorkspaceSync";

/** Scenarios — author/inspect scenarios; the bottom bar drives selection. */
export default function ScenariosPage() {
  return (
    <>
      <WorkspaceSync workspace="scenarios" />
      <div className="pointer-events-auto mr-auto h-full w-[380px] max-w-full">
        <ScenarioDetail className="h-full" />
      </div>
    </>
  );
}
