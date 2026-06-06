'use client';

import type { Proposal } from '@/types/coverage';

interface AgentPanelProps {
  proposals: Proposal[];
  onFlyToProposal: (proposal: { lat: number; lng: number }, index: number) => void;
  onOverview: () => void;
}

export default function AgentPanel({ proposals, onFlyToProposal, onOverview }: AgentPanelProps) {
  const accepted = proposals.filter((p) => p.accepted);
  const rejected = proposals.filter((p) => !p.accepted);

  return (
    <div className="fixed bottom-4 right-4 z-10 w-72 rounded-xl bg-black/75 text-white backdrop-blur-sm shadow-xl border border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-white/90">
          Agent Proposals
        </h2>
        <div className="mt-1 flex gap-3 text-xs">
          <span className="text-emerald-400 font-medium">
            {accepted.length} accepted
          </span>
          <span className="text-red-400 font-medium">
            {rejected.length} rejected
          </span>
        </div>
      </div>

      {/* Proposal list */}
      <ul className="max-h-64 overflow-y-auto divide-y divide-white/5">
        {proposals.map((proposal, i) => (
          <li key={proposal.id} className="px-4 py-2.5 flex items-start gap-3">
            {/* Status dot */}
            <span
              className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                proposal.accepted ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-white/70 truncate">{proposal.id}</p>
              <p className="text-xs text-white/50">
                Score:{' '}
                <span className="text-white/80 font-medium">
                  {(proposal.score * 100).toFixed(0)}%
                </span>
              </p>
              {!proposal.accepted && proposal.reason && (
                <p className="text-xs text-red-300/70 mt-0.5 leading-tight line-clamp-2">
                  {proposal.reason}
                </p>
              )}
            </div>

            {/* Fly-to button */}
            <button
              onClick={() => onFlyToProposal({ lat: proposal.lat, lng: proposal.lng }, i)}
              className="flex-shrink-0 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={`Fly to ${proposal.id}`}
            >
              Fly to
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={onOverview}
          className="w-full py-1.5 text-xs font-medium rounded-lg bg-blue-600/70 hover:bg-blue-600 transition-colors"
        >
          Overview
        </button>
      </div>
    </div>
  );
}
