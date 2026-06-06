"use client";

import * as RSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/cn";

/** Thin HUD slider with a green fill and a square handle. */
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
      className={cn("relative flex h-4 w-full touch-none select-none items-center", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onValueChange?.(v[0])}
      onValueCommit={(v) => onValueCommit?.(v[0])}
      aria-label={ariaLabel}
    >
      <RSlider.Track className="relative h-[3px] w-full grow bg-hairline-strong">
        <RSlider.Range className="absolute h-full bg-nv shadow-[0_0_8px_var(--color-nv-glow)]" />
      </RSlider.Track>
      <RSlider.Thumb
        className="block h-3 w-[6px] cursor-grab bg-nv-bright shadow-[0_0_8px_var(--color-nv-glow)] outline-none focus-visible:ring-1 focus-visible:ring-nv active:cursor-grabbing"
        aria-label={ariaLabel}
      />
    </RSlider.Root>
  );
}
