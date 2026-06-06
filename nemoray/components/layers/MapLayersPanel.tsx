"use client";

import { useNemoStore } from "@/store";
import { Panel, PanelHeader, PanelBody } from "@/components/primitives";
import { LAYER_META } from "@/lib/layers";
import { LayerToggleList } from "./LayerToggleList";

/** Drop-in left-rail panel: map-layer toggles under a framed header. */
export function MapLayersPanel({ className }: { className?: string }) {
  const layers = useNemoStore((s) => s.layers);
  const active = LAYER_META.reduce(
    (acc, m) => acc + (layers[m.id].visible ? 1 : 0),
    0,
  );

  return (
    <Panel className={className}>
      <PanelHeader
        label="Map Layers"
        right={
          <span className="readout text-[10px] tabular-nums text-ink-faint">
            {active}/{LAYER_META.length}
          </span>
        }
      />
      <PanelBody>
        <LayerToggleList />
      </PanelBody>
    </Panel>
  );
}
