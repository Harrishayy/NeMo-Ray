"use client";

import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

/** Compact switch — a thin pill track with a round knob that turns green when on. */
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
      className={cn("nm-switch", className)}
    >
      <Switch.Thumb className="nm-switch-knob" />
    </Switch.Root>
  );
}
