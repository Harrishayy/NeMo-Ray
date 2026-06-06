"use client";

import dynamic from "next/dynamic";
import { useMemo, type ComponentType } from "react";

import { cn } from "@/lib/cn";
import { useNemoStore } from "@/store";
import type { MapSurfaceProps } from "@/lib/types";
import { MapCameraControls } from "./MapCameraControls";

/**
 * Loading skeleton shown while the (client-only) map implementation hydrates.
 */
function MapSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-bg nm-grid-bg">
      <div className="flex flex-col items-center gap-3">
        <span className="nm-eyebrow text-ink-dim">Initialising Coverage Twin</span>
        <div className="h-[2px] w-40 overflow-hidden bg-panel">
          <div className="nm-shimmer h-full w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Resolve the active map implementation. Defaults to the bundled placeholder;
 * `NEXT_PUBLIC_MAP_IMPL=cesium` opts into the CesiumJS 3D scene.
 */
const MAP_IMPL = process.env.NEXT_PUBLIC_MAP_IMPL ?? "placeholder";

const MapSurface: ComponentType<MapSurfaceProps> = dynamic(
  async () => {
    // CesiumJS 3D scene (Google Photorealistic Tiles) — the live demo map.
    if (MAP_IMPL === "cesium") {
      const mod = await import("./CesiumScene");
      return { default: mod.CesiumScene };
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
  const cameraCommand = useNemoStore((s) => s.cameraCommand);
  const selectSite = useNemoStore((s) => s.selectSite);
  const hoverSite = useNemoStore((s) => s.hoverSite);
  const requestCamera = useNemoStore((s) => s.requestCamera);

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
      cameraCommand,
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
      cameraCommand,
      selectSite,
      hoverSite,
    ],
  );

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapSurface {...surfaceProps} />
      {MAP_IMPL === "cesium" && <MapCameraControls onCommand={requestCamera} />}
    </div>
  );
}
