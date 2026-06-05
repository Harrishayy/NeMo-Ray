import type { Proposal, DeadZone } from '../../types/coverage';

function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const REJECTION_REASONS = [
  'Dense vegetation canopy detected at 14m — line-of-sight broken',
  'Heritage-listed building within 50m exclusion zone',
  'Existing underground utilities conflict with foundation depth',
  'Residential planning objection zone — requires additional survey',
  'Signal gain below threshold after terrain shadowing adjustment',
];

export function generateProposals(deadZones: DeadZone[], seed = 13): Proposal[] {
  const rand = mulberry32(seed);
  return deadZones.map((dz, i) => {
    const [lng, lat] = dz.geometry.coordinates[0][0]; // first vertex as proposal loc
    const score = 0.4 + rand() * 0.55; // 0.4–0.95
    const accepted = rand() < 0.6;
    const reason = accepted
      ? ''
      : REJECTION_REASONS[Math.floor(rand() * REJECTION_REASONS.length)];

    return {
      id: `proposal-${i.toString().padStart(2, '0')}`,
      lat,
      lng,
      score,
      accepted,
      reason,
    };
  });
}
