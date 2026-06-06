import { WorkspaceSync } from "@/components/shell/WorkspaceSync";

/** Mission Control — the full HUD. The map + rails + bottom bar carry it. */
export default function MissionPage() {
  return <WorkspaceSync workspace="mission" />;
}
