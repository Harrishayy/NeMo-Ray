"use client";

import { useEffect } from "react";

import { useNemoStore } from "@/store";

/**
 * Drives timeline playback. While the store's `playing` flag is set, runs a
 * requestAnimationFrame loop that calls `tick(dt)` once per frame with the real
 * elapsed milliseconds since the previous frame (via `performance.now()` deltas,
 * NOT a fixed step). The loop is torn down when playback stops or the component
 * unmounts. Mount this ONCE (the bottom-bar shell does so).
 */
export function useTimelinePlayback(): void {
  const playing = useNemoStore((s) => s.playing);

  useEffect(() => {
    if (!playing) return;

    let raf = 0;
    let last = performance.now();
    // Read `tick` lazily from the store so we never capture a stale action.
    const tick = useNemoStore.getState().tick;

    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      if (dt > 0) tick(dt);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}
