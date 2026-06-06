"use client";

import * as RTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={250} skipDelayDuration={400}>
      {children}
    </RTooltip.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-[240px] border border-hairline-strong bg-elevated px-2.5 py-1.5 text-xs text-ink shadow-[0_0_22px_-6px_var(--color-nv-glow)]",
            "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
            className,
          )}
        >
          {content}
          <RTooltip.Arrow className="fill-[var(--color-elevated)]" />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}
