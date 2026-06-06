import { lngLatToNorm } from "@/lib/geo/bbox";
import type { LngLat, Proposal } from "@/lib/types";

interface RawProposal {
  id: string;
  label: string;
  position: LngLat;
  coverageGainPct: number;
  estCostGbp: number;
  rationale: string;
  status: Proposal["status"];
  validation?: Proposal["validation"];
}

const RAW: RawProposal[] = [
  {
    id: "P-01",
    label: "Horseferry Rd rooftop",
    position: [-0.1305, 51.4948],
    coverageGainPct: 8.4,
    estCostGbp: 142000,
    rationale: "Closes the SW1 hole left by the Westminster hub; rooftop line-of-sight to 3 demand cells.",
    status: "accepted",
    validation: { source: "LiDAR", verdict: "pass", reason: "Clear rooftop LoS — no canopy obstruction." },
  },
  {
    id: "P-02",
    label: "Lambeth Bridge mast",
    position: [-0.1219, 51.4925],
    coverageGainPct: 5.1,
    estCostGbp: 168000,
    rationale: "Riverside infill improving south-bank throughput during major events.",
    status: "validating",
  },
  {
    id: "P-03",
    label: "Vauxhall sidings",
    position: [-0.1244, 51.4865],
    coverageGainPct: 6.7,
    estCostGbp: 121000,
    rationale: "cuOpt flagged a spacing-optimal site; Nemotron rejected the first pick.",
    status: "rejected",
    validation: { source: "LiDAR", verdict: "fail", reason: "15 m dense vegetation canopy breaks line-of-sight." },
  },
  {
    id: "P-04",
    label: "Pimlico estate roof",
    position: [-0.1356, 51.4895],
    coverageGainPct: 4.3,
    estCostGbp: 98000,
    rationale: "Secondary infill candidate; lower gain but cheapest of the set.",
    status: "proposed",
  },
];

export const MOCK_PROPOSALS: Proposal[] = RAW.map((r) => ({
  ...r,
  placement: lngLatToNorm(r.position),
}));
