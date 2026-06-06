"use client";

import * as RSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/cn";

/** Thin range control with a green fill and a round green-ringed thumb. */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?(v: number): void;
  onValueCommit?(v: number): void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <RSlider.Root
      className={cn("nm-slider", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange?.(v[0])}
      onValueCommit={(v) => onValueCommit?.(v[0])}
      aria-label={ariaLabel}
    >
      <RSlider.Track className="nm-slider-track">
        <RSlider.Range className="nm-slider-range" />
      </RSlider.Track>
      {/* Visual-only thumb: Radix owns positioning, so we apply the skill's
          round green-ringed look via token utilities (not .nm-slider-thumb,
          whose absolute positioning would fight Radix's inline transform). */}
      <RSlider.Thumb
        className="block h-[13px] w-[13px] cursor-grab rounded-full border-[3px] border-nv bg-white shadow-[var(--shadow-sm)] outline-none focus-visible:ring-2 focus-visible:ring-nv active:cursor-grabbing"
        aria-label={ariaLabel}
      />
    </RSlider.Root>
  );
}
