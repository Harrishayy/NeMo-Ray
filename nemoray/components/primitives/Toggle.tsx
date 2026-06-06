"use client";

import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

/** Bespoke HUD switch — a thin track with a square green thumb. */
export function Toggle({
  checked,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange(v: boolean): void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "relative h-[14px] w-[26px] shrink-0 cursor-pointer border border-hairline-strong bg-bg/60 transition-colors",
        "data-[state=checked]:border-nv data-[state=checked]:bg-nv/15",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <Switch.Thumb
        className={cn(
          "block h-[8px] w-[8px] translate-x-[3px] bg-ink-faint transition-transform",
          "data-[state=checked]:translate-x-[14px] data-[state=checked]:bg-nv data-[state=checked]:shadow-[0_0_8px_var(--color-nv-glow)]",
        )}
      />
    </Switch.Root>
  );
}
