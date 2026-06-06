"use client";

import { LAYER_META } from "@/lib/layers";
import { cn } from "@/lib/cn";
import { LayerToggle } from "./LayerToggle";

/** All map-layer toggles, in canonical order, hairline-divided. */
export function LayerToggleList({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col divide-y divide-hairline", className)}>
      {LAYER_META.map((m) => (
        <LayerToggle key={m.id} id={m.id} />
      ))}
    </div>
  );
}
