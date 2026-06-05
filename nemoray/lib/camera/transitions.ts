export type TransitionPreset = {
  zoom: number;
  pitch: number;
  bearing: number;
  duration: number;
};

export const PRESETS = {
  OVERVIEW: { zoom: 10, pitch: 30, bearing: 0, duration: 1800 },
  INSPECT:  { zoom: 16, pitch: 65, bearing: -20, duration: 2200 },
  ORBIT_START: { zoom: 14, pitch: 55, bearing: 0, duration: 1000 },
  REJECTED_ZOOM: { zoom: 17, pitch: 70, bearing: 15, duration: 1500 },
} satisfies Record<string, TransitionPreset>;

export type PresetName = keyof typeof PRESETS;

// startOrbit: starts an animated orbit (bearing +180 over durationMs)
// Returns a cancel function
export function startOrbit(
  flyTo: (params: { bearing: number; duration: number }) => void,
  durationMs = 6000
): () => void {
  let cancelled = false;
  const startTime = performance.now();
  const startBearing = 0;

  function tick() {
    if (cancelled) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    flyTo({ bearing: startBearing + 180 * progress, duration: 0 });
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return () => { cancelled = true; };
}
