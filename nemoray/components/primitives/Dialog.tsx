"use client";

import * as RDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?(v: boolean): void;
  trigger?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <RDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2",
            "rounded-[var(--radius-card)] border border-hairline-strong bg-panel-2 shadow-[var(--shadow-lg)]",
            className,
          )}
        >
          <div className="flex h-10 items-center gap-2.5 border-b border-[var(--line-subtle)] px-3">
            <span className="nm-card-tick" />
            <RDialog.Title className="nm-eyebrow text-ink">{title}</RDialog.Title>
            <RDialog.Close className="ml-auto text-ink-dim transition-colors hover:text-ink">
              <X size={15} />
            </RDialog.Close>
          </div>
          <div className="p-4">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
