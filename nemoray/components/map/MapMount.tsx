"use client";

import dynamic from "next/dynamic";
import { useMemo, type ComponentType } from "react";

import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";
import type { MapSurfaceProps } from "@/lib/types";

/**
 * Loading skeleton shown while the (client-only) map implementation hydrates.
 */
function MapSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-bg bg-grid">
      <div className="flex flex-col items-center gap-3">
        <span className="eyebrow text-ink-dim">Initialising Coverage Twin</span>
        <div className="h-[2px] w-40 overflow-hidden bg-panel">
          <div className="shimmer h-full w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Resolve the active map implementation. Defaults to the bundled placeholder.
 * `NEXT_PUBLIC_MAP_IMPL=deck` opts into the collaborator's `DeckScene` (which
 * may not exist yet) and gracefully falls back to the placeholder if missing.
 *
 * The `deck` import path is built from a variable so the bundler never tries to
 * statically resolve a module that hasn't been written.
 */
const MAP_IMPL = process.env.NEXT_PUBLIC_MAP_IMPL ?? "placeholder";

// Built from a variable so neither TypeScript nor the bundler tries to
// statically resolve `./DeckScene` before the collaborator has written it.
const DECK_MODULE = "./DeckScene";

const MapSurface: ComponentType<MapSurfaceProps> = dynamic(
  async () => {
    if (MAP_IMPL === "deck") {
      try {
        const mod = (await import(
          /* webpackIgnore: true */ DECK_MODULE
        )) as { DeckScene: ComponentType<MapSurfaceProps> };
        return { default: mod.DeckScene };
      } catch {
        // DeckScene not built yet — fall through to placeholder.
      }
    }
    const mod = await import("./MapPlaceholder");
    return { default: mod.MapPlaceholder };
  },
  { ssr: false, loading: () => <MapSkeleton /> },
);

/**
 * The single map entry the app shell renders. Pulls the live state out of the
 * store, assembles the {@link MapSurfaceProps} contract, and hands it to the
 * chosen implementation. Implementations never touch the store directly.
 */
export function MapMount({ className }: { className?: string }) {
  const sites = useNemoStore((s) => s.sites);
  const radioMap = useNemoStore((s) => s.radioMap);
  const selectedSiteId = useNemoStore((s) => s.selectedSiteId);
  const hoveredSiteId = useNemoStore((s) => s.hoveredSiteId);
  const deactivatedSiteIds = useNemoStore((s) => s.deactivatedSiteIds);
  const proposals = useNemoStore((s) => s.proposals);
  const layers = useNemoStore((s) => s.layers);
  const coverageStatus = useNemoStore((s) => s.coverageStatus);
  const selectSite = useNemoStore((s) => s.selectSite);
  const hoverSite = useNemoStore((s) => s.hoverSite);

  const surfaceProps = useMemo<MapSurfaceProps>(
    () => ({
      sites,
      radioMap,
      selectedSiteId,
      hoveredSiteId,
      deactivatedSiteIds,
      proposals,
      layers,
      coverageStatus,
      onSelectSite: selectSite,
      onHoverSite: hoverSite,
    }),
    [
      sites,
      radioMap,
      selectedSiteId,
      hoveredSiteId,
      deactivatedSiteIds,
      proposals,
      layers,
      coverageStatus,
      selectSite,
      hoverSite,
    ],
  );

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapSurface {...surfaceProps} />
    </div>
  );
}
