"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";
import { mbpsToRGB, rgbCss } from "@/lib/geo/color";
import type {
  CoverageCell,
  DeadZone,
  MapSurfaceProps,
  Site,
} from "@/lib/types";

import { CoverageLegend } from "./CoverageLegend";
import { MapOverlayHUD } from "./MapOverlayHUD";

/**
 * The interactive placeholder map surface. Implements {@link MapSurfaceProps}
 * exactly — reads NOTHING from the store directly (props only) so it stays a
 * clean, swappable seam with the CesiumJS `CesiumScene`.
 *
 * Renders an oblique near-black "London stage": a draped radio-map heatmap,
 * tower nodes with vertical beam shafts, backhaul arcs, and pulsing red dead
 * zones — the money-shot when a tower is deactivated.
 */
export function MapPlaceholder(props: MapSurfaceProps) {
  const {
    sites,
    radioMap,
    selectedSiteId,
    hoveredSiteId,
    proposals,
    layers,
    coverageStatus,
    onSelectSite,
    onHoverSite,
  } = props;

  const sitesById = useMemo(() => {
    const m = new Map<string, Site>();
    for (const s of sites) m.set(s.id, s);
    return m;
  }, [sites]);

  // tx power range → beam height normalisation
  const txRange = useMemo(() => {
    if (sites.length === 0) return { min: 40, max: 47 };
    let min = Infinity;
    let max = -Infinity;
    for (const s of sites) {
      if (s.txPowerDbm < min) min = s.txPowerDbm;
      if (s.txPowerDbm > max) max = s.txPowerDbm;
    }
    return { min, max: max === min ? min + 1 : max };
  }, [sites]);

  const showLabelsLayer = layers.labels.visible;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      {/* ── perspective stage (oblique London) ── */}
      <div className="absolute inset-0 bg-bg bg-grid scanlines">
        {/* horizon vignette to sell the oblique depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 110%, transparent 40%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 22%)",
          }}
        />

        {/* the tilted scene plane — perspective for depth, content stays crisp */}
        <div
          className="absolute inset-0"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 38%" }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: "rotateX(34deg) scale(1.04)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* radio-map heatmap */}
            {radioMap && layers.radioMap.visible && (
              <HeatmapLayer
                cells={radioMap.cells}
                gridW={radioMap.gridW}
                gridH={radioMap.gridH}
                opacity={layers.radioMap.opacity}
              />
            )}

            {/* backhaul arcs (SVG, beneath nodes) */}
            {(layers.backhaul.visible || layers.arcs.visible) && (
              <BackhaulLayer
                sites={sites}
                sitesById={sitesById}
                opacity={Math.max(
                  layers.backhaul.visible ? layers.backhaul.opacity : 0,
                  layers.arcs.visible ? layers.arcs.opacity * 0.5 : 0,
                )}
              />
            )}

            {/* dead zones — pulsing red blobs */}
            {radioMap && layers.deadzone.visible && (
              <DeadZoneLayer
                zones={radioMap.deadZones}
                opacity={layers.deadzone.opacity}
              />
            )}

            {/* beams + tower nodes */}
            {sites.map((site) => (
              <TowerNode
                key={site.id}
                site={site}
                selected={site.id === selectedSiteId}
                hovered={site.id === hoveredSiteId}
                showBeam={layers.beams.visible && site.status === "active"}
                beamOpacity={layers.beams.opacity}
                showSite={layers.sites.visible}
                showLabel={
                  showLabelsLayer ||
                  site.id === selectedSiteId ||
                  site.id === hoveredSiteId
                }
                txRange={txRange}
                onSelect={onSelectSite}
                onHover={onHoverSite}
              />
            ))}

            {/* cuOpt proposal ghosts */}
            {proposals.map((p) => (
              <ProposalGhost key={p.id} x={p.placement.x} y={p.placement.y} />
            ))}
          </div>
        </div>
      </div>

      {/* ── computing sweep overlay ── */}
      {coverageStatus === "computing" && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="absolute inset-0 shimmer opacity-40" />
          <div className="absolute left-1/2 top-3 -translate-x-1/2 border border-warning/40 bg-panel/80 px-2.5 py-1 backdrop-blur-sm">
            <span className="eyebrow flex items-center gap-1.5 text-warning">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-warning shadow-[0_0_8px_var(--color-warning)]" />
              Recomputing Coverage
            </span>
          </div>
        </div>
      )}

      {/* ── compass (top-left, below callout it never collides because HUD is conditional) ── */}
      <Compass />

      {/* ── intentional placeholder ribbon ── */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 border border-hairline bg-panel/80 px-2 py-1 backdrop-blur-sm">
        <span className="eyebrow flex items-center gap-1.5 text-ink-faint">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-nv shadow-[0_0_8px_var(--color-nv-glow)]" />
          Placeholder · Awaiting RT Render
        </span>
      </div>

      {/* ── DOM overlays (outside the transformed stage) ── */}
      <MapOverlayHUD />
      <CoverageLegend className="absolute bottom-3 left-3 z-20" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Heatmap                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function HeatmapLayer({
  cells,
  gridW,
  gridH,
  opacity,
}: {
  cells: CoverageCell[];
  gridW: number;
  gridH: number;
  opacity: number;
}) {
  // cell footprint as a % of the stage (slightly oversized so they bleed/merge)
  const wPct = (100 / gridW) * 1.35;
  const hPct = (100 / gridH) * 1.35;

  return (
    <div
      className="absolute inset-0"
      style={{ opacity, mixBlendMode: "screen", filter: "blur(7px)" }}
      aria-hidden
    >
      {cells.map((cell) => {
        const rgb = mbpsToRGB(cell.dlMbps);
        return (
          <div
            key={cell.id}
            className="absolute"
            style={{
              left: `${cell.n.x * 100}%`,
              top: `${cell.n.y * 100}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              transform: "translate(-50%, -50%)",
              background: rgbCss(rgb, cell.congested ? 0.85 : 0.6),
            }}
          />
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Backhaul arcs                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function BackhaulLayer({
  sites,
  sitesById,
  opacity,
}: {
  sites: Site[];
  sitesById: Map<string, Site>;
  opacity: number;
}) {
  const links = sites.flatMap((s) => {
    if (!s.backhaulTargetId) return [];
    const target = sitesById.get(s.backhaulTargetId);
    if (!target) return [];
    return [{ id: `${s.id}->${target.id}`, from: s, to: target }];
  });

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {links.map((l) => {
        const x1 = l.from.placement.x * 100;
        const y1 = l.from.placement.y * 100;
        const x2 = l.to.placement.x * 100;
        const y2 = l.to.placement.y * 100;
        // bow the link upward slightly
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.12;
        return (
          <path
            key={l.id}
            d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke="var(--color-nv)"
            strokeWidth={0.25}
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Dead zones                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

function DeadZoneLayer({
  zones,
  opacity,
}: {
  zones: DeadZone[];
  opacity: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {zones.map((z) => {
        const sizePct = Math.max(6, z.radius * 200); // radius is normalised
        const intensity =
          z.severity === "critical" ? 0.5 : z.severity === "major" ? 0.38 : 0.26;
        return (
          <div
            key={z.id}
            className="absolute animate-pulse-soft"
            style={{
              left: `${z.center.x * 100}%`,
              top: `${z.center.y * 100}%`,
              width: `${sizePct}%`,
              height: `${sizePct}%`,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,59,48,${intensity}) 0%, rgba(255,59,48,${intensity * 0.4}) 45%, transparent 72%)`,
              mixBlendMode: "screen",
            }}
          >
            <div
              className="absolute inset-[30%] rounded-full border border-critical/50"
              style={{ boxShadow: "0 0 18px -2px var(--color-critical)" }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Tower node + beam                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

function TowerNode({
  site,
  selected,
  hovered,
  showBeam,
  beamOpacity,
  showSite,
  showLabel,
  txRange,
  onSelect,
  onHover,
}: {
  site: Site;
  selected: boolean;
  hovered: boolean;
  showBeam: boolean;
  beamOpacity: number;
  showSite: boolean;
  showLabel: boolean;
  txRange: { min: number; max: number };
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  if (!showSite) return null;

  const active = site.status === "active";
  const failover = site.status === "failover";

  // beam height ∝ tx power, in % of stage height
  const tNorm = (site.txPowerDbm - txRange.min) / (txRange.max - txRange.min);
  const beamH = 10 + tNorm * 16; // 10%..26%

  const markerColor = active
    ? "var(--color-nv)"
    : failover
      ? "var(--color-warning)"
      : "var(--color-critical)";

  return (
    <div
      className="absolute"
      style={{
        left: `${site.placement.x * 100}%`,
        top: `${site.placement.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* beam shaft (rises "up" = toward north/top in screen space) */}
      {showBeam && (
        <div
          className="pointer-events-none absolute left-1/2 bottom-0"
          style={{
            width: "2px",
            height: `${beamH}vh`,
            transform: "translate(-50%, 0)",
            opacity: beamOpacity,
            background:
              "linear-gradient(to top, var(--color-nv) 0%, rgba(118,185,0,0.35) 55%, transparent 100%)",
            boxShadow: "0 0 10px -1px var(--color-nv-glow)",
          }}
        />
      )}

      {/* selected pulsing ring */}
      {selected && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft rounded-full"
          style={{
            width: "30px",
            height: "30px",
            border: `1px solid ${markerColor}`,
            boxShadow: `0 0 16px -2px ${markerColor}`,
          }}
        />
      )}

      {/* interactive marker (crosshair diamond) */}
      <button
        aria-label={`Site ${site.id} ${site.name}`}
        onClick={() => onSelect(site.id)}
        onMouseEnter={() => onHover(site.id)}
        onMouseLeave={() => onHover(null)}
        className="group relative block cursor-pointer"
        style={{ width: "16px", height: "16px", transform: "translate(-50%, -50%)" }}
      >
        {/* crosshair ticks */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "16px", height: "1px", background: markerColor, opacity: 0.5 }}
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "1px", height: "16px", background: markerColor, opacity: 0.5 }}
        />
        {/* diamond */}
        <span
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-125",
            (hovered || selected) && "scale-125",
          )}
          style={{
            width: "8px",
            height: "8px",
            transform: "translate(-50%, -50%) rotate(45deg)",
            background: active ? markerColor : "transparent",
            border: `1px solid ${markerColor}`,
            boxShadow: active
              ? `0 0 10px -1px ${markerColor}`
              : "none",
          }}
        />
      </button>

      {/* label */}
      {showLabel && (
        <div
          className="pointer-events-none absolute left-1/2 whitespace-nowrap"
          style={{ transform: "translate(-50%, 6px)", top: "8px" }}
        >
          <div
            className={cn(
              "border bg-panel/85 px-1.5 py-0.5 backdrop-blur-sm",
              selected ? "border-hairline-strong" : "border-hairline",
            )}
          >
            <span
              className="readout text-[9px]"
              style={{ color: active ? "var(--color-nv)" : markerColor }}
            >
              {site.id}
            </span>
            <span className="ml-1 text-[9px] text-ink-dim">{site.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* cuOpt proposal ghost                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

function ProposalGhost({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="animate-pulse-soft"
        style={{
          width: "12px",
          height: "12px",
          transform: "rotate(45deg)",
          border: "1px dashed var(--color-info)",
          boxShadow: "0 0 10px -2px var(--color-info)",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Compass                                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function Compass() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 opacity-60 sm:left-auto sm:right-[12.5rem] sm:translate-x-0">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="var(--color-hairline-strong)"
          strokeWidth="1"
        />
        <path d="M22 5 L25 22 L22 20 L19 22 Z" fill="var(--color-nv)" />
        <path d="M22 39 L19 22 L22 24 L25 22 Z" fill="var(--color-ink-faint)" />
        <text
          x="22"
          y="13"
          textAnchor="middle"
          className="readout"
          style={{ fontSize: "7px", fill: "var(--color-ink-dim)" }}
        >
          N
        </text>
      </svg>
    </div>
  );
}
