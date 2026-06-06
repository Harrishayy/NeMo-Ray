import type { MastSite } from '../../types/coverage';

// Seeded PRNG (same mulberry32 pattern)
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Inner London centre for bias
const CENTRE = { lat: 51.5074, lng: -0.1278 };

export function generateMastSites(n: number, seed = 7): MastSite[] {
  const rand = mulberry32(seed);
  const sites: MastSite[] = [];

  for (let i = 0; i < n; i++) {
    // Gaussian-ish distribution biased toward inner London
    const r = 0.08 + rand() * 0.28; // radius from centre in degrees
    const angle = rand() * Math.PI * 2;
    const lat = CENTRE.lat + r * Math.sin(angle) * 0.7;
    const lng = CENTRE.lng + r * Math.cos(angle);

    sites.push({
      id: `mast-${i.toString().padStart(3, '0')}`,
      lat,
      lng,
      active: rand() < 0.85, // ~85% active
    });
  }

  return sites;
}
