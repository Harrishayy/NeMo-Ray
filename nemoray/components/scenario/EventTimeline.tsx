"use client";

import { FastForward, Pause, Play, Radio, Rewind } from "lucide-react";
import { useMemo } from "react";

import { Slider } from "@/components/primitives";
import { TimelineMarker } from "@/components/scenario/TimelineMarker";
import { useTimelinePlayback } from "@/hooks/useTimelinePlayback";
import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";

const HOUR = 3600_000;
const SPEEDS = [1, 2, 4] as const;

/** HH:MM from a millisecond offset. */
function clock(tMs: number): string {
  const total = Math.max(0, Math.floor(tMs / 60_000));
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Hourly ruler ticks across the span. */
function useRulerTicks(durationMs: number) {
  return useMemo(() => {
    const ticks: { tMs: number; pct: number }[] = [];
    for (let t = 0; t <= durationMs; t += HOUR) {
      ticks.push({ tMs: t, pct: (t / durationMs) * 100 });
    }
    return ticks;
  }, [durationMs]);
}

/** The scrubber: ruler, event markers, playhead slider, and transport. */
export function EventTimeline({ className }: { className?: string }) {
  useTimelinePlayback();

  const positionMs = useNemoStore((s) => s.positionMs);
  const durationMs = useNemoStore((s) => s.durationMs);
  const playing = useNemoStore((s) => s.playing);
  const speed = useNemoStore((s) => s.speed);
  const events = useNemoStore((s) => s.events);
  const timelineMode = useNemoStore((s) => s.timelineMode);

  const play = useNemoStore((s) => s.play);
  const pause = useNemoStore((s) => s.pause);
  const seek = useNemoStore((s) => s.seek);
  const setLive = useNemoStore((s) => s.setLive);
  const setSpeed = useNemoStore((s) => s.setSpeed);

  const ticks = useRulerTicks(durationMs);
  const playheadPct = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  const isLive = timelineMode === "live";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* ── transport ── */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Rewind to start"
          onClick={() => seek(0)}
          className="flex h-7 w-7 items-center justify-center border border-hairline text-ink-dim transition-colors hover:border-hairline-strong hover:text-ink"
        >
          <Rewind size={13} />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => (playing ? pause() : play())}
          className={cn(
            "flex h-7 w-8 items-center justify-center border transition-all",
            playing
              ? "border-nv bg-nv/15 text-nv shadow-[0_0_14px_-4px_var(--color-nv-glow)]"
              : "border-hairline-strong text-ink hover:border-nv hover:text-nv",
          )}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* speed selector */}
        <div className="ml-1 flex items-center border border-hairline">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s}x speed`}
              aria-pressed={speed === s}
              onClick={() => setSpeed(s)}
              className={cn(
                "readout flex h-7 w-7 items-center justify-center text-[11px] transition-colors",
                speed === s
                  ? "bg-nv/15 text-nv"
                  : "text-ink-faint hover:text-ink-dim",
              )}
            >
              {s}
              <FastForward size={8} className="ml-px opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* ── scrubber track ── */}
      <div className="relative min-w-0 flex-1">
        {/* ruler labels */}
        <div className="relative mb-1 h-3">
          {ticks.map((t) => (
            <span
              key={t.tMs}
              className="readout absolute -translate-x-1/2 text-[9px] text-ink-faint"
              style={{ left: `${t.pct}%` }}
            >
              {clock(t.tMs)}
            </span>
          ))}
        </div>

        {/* marker band */}
        <div className="relative h-5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-hairline" />
          {events.map((e) => (
            <TimelineMarker
              key={e.id}
              event={e}
              leftPct={durationMs > 0 ? (e.tMs / durationMs) * 100 : 0}
            />
          ))}

          {/* glowing playhead line + readout */}
          <div
            className="pointer-events-none absolute -top-3 bottom-0 z-20 -translate-x-1/2"
            style={{ left: `${playheadPct}%` }}
          >
            <span className="readout absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bg/80 px-1 text-[10px] text-nv-bright text-glow">
              {clock(positionMs)}
            </span>
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-nv shadow-[0_0_8px_var(--color-nv-glow)]" />
          </div>
        </div>

        {/* draggable playhead */}
        <div className="mt-1">
          <Slider
            value={positionMs}
            min={0}
            max={durationMs}
            step={HOUR / 60}
            onValueChange={seek}
            aria-label="Timeline position"
          />
        </div>
      </div>

      {/* ── live ── */}
      <button
        type="button"
        aria-label="Jump to live"
        aria-pressed={isLive}
        onClick={setLive}
        className={cn(
          "flex h-7 shrink-0 items-center gap-1.5 border px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-all",
          isLive
            ? "border-nv bg-nv/15 text-nv shadow-[0_0_14px_-4px_var(--color-nv-glow)]"
            : "border-hairline-strong text-ink-dim hover:border-nv hover:text-nv",
        )}
      >
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            isLive ? "bg-nv shadow-[0_0_8px_var(--color-nv)] animate-pulse-soft" : "bg-ink-faint",
          )}
        />
        <Radio size={11} className="opacity-70" />
        Live
      </button>
    </div>
  );
}
