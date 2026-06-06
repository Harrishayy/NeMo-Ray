import type { CoverageLevel, RGB } from "@/lib/types";

/**
 * Shared downlink-bandwidth colour ramp. Used by BOTH the map surface and the
 * legend so they can never drift. Red (dead) → blue (excellent).
 */
export const SIGNAL_STOPS: { t: number; rgb: RGB }[] = [
  { t: 0.0, rgb: [255, 59, 48] }, // critical
  { t: 0.25, rgb: [255, 138, 0] }, // low
  { t: 0.5, rgb: [255, 214, 10] }, // medium
  { t: 0.75, rgb: [118, 185, 0] }, // good (NVIDIA green)
  { t: 1.0, rgb: [0, 208, 255] }, // excellent
];

/** Max downlink used to normalise Mbps → [0,1] for the ramp. */
export const DL_MAX_MBPS = 150;

export const LEVEL_RGB: Record<CoverageLevel, RGB> = {
  critical: [255, 59, 48],
  low: [255, 138, 0],
  medium: [255, 214, 10],
  good: [118, 185, 0],
  excellent: [0, 208, 255],
};

export function mbpsToLevel(mbps: number): CoverageLevel {
  if (mbps < 5) return "critical";
  if (mbps < 20) return "low";
  if (mbps < 50) return "medium";
  if (mbps < 100) return "good";
  return "excellent";
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Sample the ramp at t∈[0,1], returning an interpolated RGB. */
export function rampRGB(t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < SIGNAL_STOPS.length - 1; i++) {
    const a = SIGNAL_STOPS[i];
    const b = SIGNAL_STOPS[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const lt = (clamped - a.t) / (b.t - a.t);
      return [
        Math.round(lerp(a.rgb[0], b.rgb[0], lt)),
        Math.round(lerp(a.rgb[1], b.rgb[1], lt)),
        Math.round(lerp(a.rgb[2], b.rgb[2], lt)),
      ];
    }
  }
  return SIGNAL_STOPS[SIGNAL_STOPS.length - 1].rgb;
}

export function mbpsToRGB(mbps: number): RGB {
  return rampRGB(mbps / DL_MAX_MBPS);
}

export function rgbCss([r, g, b]: RGB, a = 1): string {
  return a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`;
}

/** CSS gradient string for the legend bar. */
export function signalGradientCss(): string {
  const stops = SIGNAL_STOPS.map(
    (s) => `${rgbCss(s.rgb)} ${Math.round(s.t * 100)}%`,
  ).join(", ");
  return `linear-gradient(90deg, ${stops})`;
}
