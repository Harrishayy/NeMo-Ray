"use client";

import type { LucideIcon } from "lucide-react";
import {
  Cable,
  CircleSlash,
  Radio,
  RadioTower,
  Spline,
  Tag,
  Zap,
} from "lucide-react";
import { useNemoStore } from "@/store";
import type { LayerId } from "@/lib/types";
import { LAYER_META } from "@/lib/layers";
import { Slider, Toggle, Tooltip } from "@/components/primitives";
import { cn } from "@/lib/cn";

const ICON: Record<LayerId, LucideIcon> = {
  radioMap: Radio,
  sites: RadioTower,
  beams: Zap,
  arcs: Spline,
  backhaul: Cable,
  deadzone: CircleSlash,
  labels: Tag,
};

const META = Object.fromEntries(LAYER_META.map((m) => [m.id, m])) as Record<
  LayerId,
  (typeof LAYER_META)[number]
>;

/** One map-layer row: icon, label (+ hint tooltip), toggle, inline opacity. */
export function LayerToggle({ id }: { id: LayerId }) {
  const layer = useNemoStore((s) => s.layers[id]);
  const toggleLayer = useNemoStore((s) => s.toggleLayer);
  const setLayerOpacity = useNemoStore((s) => s.setLayerOpacity);

  const meta = META[id];
  const Icon = ICON[id];
  const { visible, opacity } = layer;

  return (
    <div
      className={cn(
        "group/row flex flex-col gap-1.5 border-l-2 px-3 py-2 transition-colors",
        visible
          ? "border-l-nv/60 hover:bg-nv/[0.03]"
          : "border-l-transparent opacity-45 hover:opacity-70",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            visible ? "text-nv" : "text-ink-faint",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        <Tooltip content={meta.hint} side="right">
          <span className="cursor-default truncate text-[12px] font-medium tracking-wide text-ink">
            {meta.label}
          </span>
        </Tooltip>
        <span className="ml-auto shrink-0">
          <Toggle
            checked={visible}
            onCheckedChange={() => toggleLayer(id)}
            aria-label={`Toggle ${meta.label}`}
          />
        </span>
      </div>

      {visible && (
        <div className="flex items-center gap-2 pl-6 opacity-0 transition-opacity group-hover/row:opacity-100">
          <Slider
            value={Math.round(opacity * 100)}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => setLayerOpacity(id, v / 100)}
            aria-label={`${meta.label} opacity`}
            className="h-3"
          />
          <span className="readout w-8 shrink-0 text-right text-[10px] text-ink-faint">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
