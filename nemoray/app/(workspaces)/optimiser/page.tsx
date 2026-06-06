import { ProposalList } from "@/components/optimiser/ProposalList";
import { WorkspaceSync } from "@/components/shell/WorkspaceSync";

/** cuOpt Optimiser — proposals dock over the live map. */
export default function OptimiserPage() {
  return (
    <>
      <WorkspaceSync workspace="optimiser" />
      <div className="pointer-events-auto ml-auto h-full w-[400px] max-w-full">
        <ProposalList className="h-full" />
      </div>
    </>
  );
}
