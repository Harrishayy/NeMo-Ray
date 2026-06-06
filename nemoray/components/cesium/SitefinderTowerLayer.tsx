'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useCesiumViewer } from './CesiumContext';
import type { SitefinderTowerSite, TransmissionType } from '@/types/sitefinder';
import {
  getSitePrimaryColor,
  getSiteVisualHeight,
  getTransmissionColor,
} from '@/lib/cesium/sitefinderVisuals';

interface SitefinderTowerLayerProps {
  sites: SitefinderTowerSite[];
  activeTypes: Set<TransmissionType>;
  selectedSiteId?: string | null;
  onSelectSite: (site: SitefinderTowerSite | null) => void;
  maxDetailedSites?: number;
}

interface SitefinderPickId {
  layer: 'sitefinder';
  siteId: string;
}

// Show 3D towers when camera is below this altitude
const DETAIL_CAMERA_HEIGHT_METERS = 8000;
const MIN_DETAIL_DISTANCE_METERS = 5600;
const DETAIL_DISTANCE_MULTIPLIER = 2.4;
const CAMERA_UPDATE_MS = 220;
// Fixed display distance for tower entities — avoids recomputing per-camera-move
const TOWER_MAX_DISPLAY_DISTANCE = 16000;

const SELECTED_OUTLINE = Cesium.Color.fromCssColorString('#ffe34d').withAlpha(1);
const ACTIVE_OUTLINE = Cesium.Color.fromCssColorString('#ff9c33').withAlpha(0.96);

// GLTF model URIs (served from public/)
const RADIO_TOWER_URI = '/models/radio_tower/scene.gltf';
const CELL_TOWER_URI = '/models/cell_tower/scene.gltf';

// Native world-space Y extents after applying all root node transforms.
// (Sketchfab FBX export, 1 GLTF unit ≈ 1 cm; Cesium treats them as metres.)
// scale = targetMetres / nativeYRange; groundOffset = abs(nativeYMin) * scale
const RADIO_TOWER_NATIVE_Y_RANGE = 12730; // Y: -5089..7641 (geometry straddles origin)
const RADIO_TOWER_NATIVE_Y_MIN = -5089;   // bottom is this many units below the entity origin
const CELL_TOWER_NATIVE_Y_RANGE = 100.4;  // Y: 0..100 after translation fix in scene.gltf
const CELL_TOWER_NATIVE_Y_MIN = 0;        // bottom sits at entity origin after GLTF fix

function isRadioTowerSite(site: SitefinderTowerSite): boolean {
  return site.transmissionTypes.includes('TETRA') || site.transmissionTypes.includes('GSM-R');
}

function modelUriForSite(site: SitefinderTowerSite): string {
  return isRadioTowerSite(site) ? RADIO_TOWER_URI : CELL_TOWER_URI;
}

function modelScaleForSite(site: SitefinderTowerSite, targetHeightMeters: number): number {
  const nativeRange = isRadioTowerSite(site)
    ? RADIO_TOWER_NATIVE_Y_RANGE
    : CELL_TOWER_NATIVE_Y_RANGE;
  return targetHeightMeters / nativeRange;
}

// How far above ground to place the model entity so its base sits at ground level.
function modelGroundOffsetMeters(site: SitefinderTowerSite, scale: number): number {
  const yMin = isRadioTowerSite(site) ? RADIO_TOWER_NATIVE_Y_MIN : CELL_TOWER_NATIVE_Y_MIN;
  return Math.abs(yMin) * scale;
}

const TOWER_DIST = new Cesium.DistanceDisplayCondition(0, TOWER_MAX_DISPLAY_DISTANCE);

function siteMatchesTypes(site: SitefinderTowerSite, activeTypes: Set<TransmissionType>): boolean {
  return site.transmissionTypes.some((type) => activeTypes.has(type));
}

function getDetailDistanceMeters(cameraHeightMeters: number): number {
  return Math.max(MIN_DETAIL_DISTANCE_METERS, cameraHeightMeters * DETAIL_DISTANCE_MULTIPLIER);
}

function isSiteInRectangle(site: SitefinderTowerSite, rectangle: Cesium.Rectangle | undefined): boolean {
  if (!rectangle) return true;
  const lng = Cesium.Math.toRadians(site.lng);
  const lat = Cesium.Math.toRadians(site.lat);
  const pad = Cesium.Math.toRadians(0.015);
  return (
    lng >= rectangle.west - pad &&
    lng <= rectangle.east + pad &&
    lat >= rectangle.south - pad &&
    lat <= rectangle.north + pad
  );
}

interface SitefinderPickedFeature {
  primitive?: { id?: SitefinderPickId };
  id?: {
    properties?: {
      sitefinderSiteId?: Cesium.Property;
    };
  };
}

function getPickedSiteId(picked: SitefinderPickedFeature | undefined): string | undefined {
  const primitiveId = picked?.primitive?.id;
  if (primitiveId?.layer === 'sitefinder') return primitiveId.siteId;
  const entity = picked?.id;
  const property = entity?.properties?.sitefinderSiteId;
  const propertyValue = typeof property?.getValue === 'function' ? property.getValue(Cesium.JulianDate.now()) : undefined;
  return typeof propertyValue === 'string' ? propertyValue : undefined;
}

function localOffset(
  lng: number, lat: number, height: number,
  east: number, north: number, up = 0
): Cesium.Cartesian3 {
  const origin = Cesium.Cartesian3.fromDegrees(lng, lat, height);
  const tf = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  return Cesium.Matrix4.multiplyByPoint(tf, new Cesium.Cartesian3(east, north, up), new Cesium.Cartesian3());
}

function orientAt(position: Cesium.Cartesian3, headingDeg: number): Cesium.Quaternion {
  return Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(headingDeg), 0, 0)
  );
}

function siteProps(site: SitefinderTowerSite) {
  return { sitefinderSiteId: site.id };
}


function buildTowerEntities(
  viewer: Cesium.Viewer,
  site: SitefinderTowerSite,
  isSelected: boolean,
  groundHeight: number
): Cesium.Entity[] {
  const entities: Cesium.Entity[] = [];
  const towerHeight = Math.max(32, getSiteVisualHeight(site));
  const g = groundHeight;
  const props = siteProps(site);
  const dd = TOWER_DIST;

  // GLTF model — replaces procedural spine/legs/arms/cabinet
  const scale = modelScaleForSite(site, towerHeight);
  const groundOffset = modelGroundOffsetMeters(site, scale);
  const modelPos = Cesium.Cartesian3.fromDegrees(site.lng, site.lat, g + groundOffset);
  entities.push(
    viewer.entities.add({
      properties: props,
      position: modelPos,
      model: {
        uri: modelUriForSite(site),
        scale,
        minimumPixelSize: 48,
        maximumScale: 500,
        distanceDisplayCondition: dd,
        silhouetteColor: isSelected ? SELECTED_OUTLINE : Cesium.Color.TRANSPARENT,
        silhouetteSize: isSelected ? 3.5 : 0,
      },
    })
  );

  // Antenna panels — frequency-band colour coding overlaid on top of the model
  const headings = [0, 90, 180, 270];
  site.transmissions.slice(0, 8).forEach((tx, index) => {
    const heading = headings[index % headings.length];
    const side = index % 2 === 0 ? 1 : -1;
    const lateral = side * (8 + Math.floor(index / 4) * 3);
    const tier = Math.floor(index / 4);
    const panelH = Math.max(20, towerHeight * 0.86 - tier * 9);
    const east = heading === 90 ? lateral : heading === 270 ? -lateral : 0;
    const north = heading === 0 ? lateral : heading === 180 ? -lateral : 0;
    const panelPos = localOffset(site.lng, site.lat, g + panelH, east, north);
    const color = getTransmissionColor(tx.transmissionType, tx.frequencyBand, isSelected ? 0.96 : 0.82);

    entities.push(
      viewer.entities.add({
        properties: props,
        position: panelPos,
        orientation: orientAt(panelPos, heading),
        box: {
          dimensions: new Cesium.Cartesian3(2.45, 0.65, 7.3),
          material: new Cesium.ColorMaterialProperty(color),
          distanceDisplayCondition: dd,
        },
      })
    );

    const radomePos = localOffset(site.lng, site.lat, g + panelH + 4.5, east * 0.95, north * 0.95);
    entities.push(
      viewer.entities.add({
        properties: props,
        position: radomePos,
        orientation: orientAt(radomePos, heading),
        ellipsoid: {
          radii: new Cesium.Cartesian3(1.35, 0.5, 1.35),
          material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(isSelected ? 0.82 : 0.58)),
          distanceDisplayCondition: dd,
        },
      })
    );
  });

  return entities;
}

async function sampleSiteHeights(
  viewer: Cesium.Viewer,
  sites: SitefinderTowerSite[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (sites.length === 0 || !viewer.scene.sampleHeightSupported) {
    sites.forEach((s) => result.set(s.id, 0));
    return result;
  }
  try {
    const carts = sites.map((s) => Cesium.Cartographic.fromDegrees(s.lng, s.lat));
    const sampled = await viewer.scene.sampleHeightMostDetailed(carts);
    sites.forEach((s, i) => result.set(s.id, sampled[i]?.height ?? 0));
  } catch {
    sites.forEach((s) => result.set(s.id, 0));
  }
  return result;
}

export default function SitefinderTowerLayer({
  sites,
  activeTypes,
  selectedSiteId,
  onSelectSite,
  maxDetailedSites = 48,
}: SitefinderTowerLayerProps): null {
  const viewer = useCesiumViewer();
  const pointCollectionRef = useRef<Cesium.PointPrimitiveCollection | null>(null);
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const siteLookupRef = useRef(new Map<string, SitefinderTowerSite>());
  const visibleSitesRef = useRef<SitefinderTowerSite[]>([]);
  // Terrain heights cached permanently — never re-sampled for the same site
  const terrainCacheRef = useRef(new Map<string, number>());
  const [detailedSiteIds, setDetailedSiteIds] = useState<string[]>([]);

  const visibleSites = useMemo(
    () => sites.filter((site) => siteMatchesTypes(site, activeTypes)),
    [sites, activeTypes]
  );

  useEffect(() => {
    siteLookupRef.current = new Map(visibleSites.map((s) => [s.id, s]));
    visibleSitesRef.current = visibleSites;
  }, [visibleSites]);

  const refreshDetailedSites = useCallback(() => {
    if (!viewer) return;
    const { height } = viewer.camera.positionCartographic;
    if (height > DETAIL_CAMERA_HEIGHT_METERS) {
      setDetailedSiteIds((c) => (c.length === 0 ? c : []));
      return;
    }
    const detailDist = getDetailDistanceMeters(height);
    const rect = viewer.camera.computeViewRectangle(Cesium.Ellipsoid.WGS84);
    const camPos = viewer.camera.positionWC;
    const next = visibleSitesRef.current
      .filter((s) => isSiteInRectangle(s, rect))
      .map((s) => ({
        s,
        d: Cesium.Cartesian3.distance(camPos, Cesium.Cartesian3.fromDegrees(s.lng, s.lat, 40)),
      }))
      .filter(({ d }) => d <= detailDist)
      .sort((a, b) => a.d - b.d)
      .slice(0, maxDetailedSites)
      .map(({ s }) => s.id);

    setDetailedSiteIds((c) =>
      c.length === next.length && c.every((id, i) => id === next[i]) ? c : next
    );
  }, [maxDetailedSites, viewer]);

  useEffect(() => {
    const t = setTimeout(refreshDetailedSites, 0);
    return () => clearTimeout(t);
  }, [refreshDetailedSites, visibleSites, selectedSiteId]);

  useEffect(() => {
    if (!viewer) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = viewer.camera.changed.addEventListener(() => {
      if (timeout) return;
      timeout = setTimeout(() => {
        timeout = null;
        refreshDetailedSites();
      }, CAMERA_UPDATE_MS);
    });
    return () => {
      unsub();
      if (timeout) clearTimeout(timeout);
    };
  }, [refreshDetailedSites, viewer]);

  // Points — always visible, never depth-clipped
  useEffect(() => {
    if (!viewer) return;
    if (pointCollectionRef.current) {
      viewer.scene.primitives.remove(pointCollectionRef.current);
      pointCollectionRef.current = null;
    }
    const pts = new Cesium.PointPrimitiveCollection();
    viewer.scene.primitives.add(pts);
    pointCollectionRef.current = pts;

    visibleSites.forEach((site) => {
      const sel = selectedSiteId === site.id;
      pts.add({
        id: { layer: 'sitefinder', siteId: site.id } satisfies SitefinderPickId,
        position: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 42),
        color: getSitePrimaryColor(site, sel ? 1 : 0.86),
        outlineColor: sel ? SELECTED_OUTLINE : ACTIVE_OUTLINE,
        outlineWidth: sel ? 5 : 2,
        pixelSize: sel ? 14 : 6,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, Number.MAX_VALUE),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });

    return () => {
      if (pointCollectionRef.current && !viewer.isDestroyed()) {
        viewer.scene.primitives.remove(pointCollectionRef.current);
        pointCollectionRef.current = null;
      }
    };
  }, [selectedSiteId, viewer, visibleSites]);

  useEffect(() => {
    if (!viewer) return;
    if (handlerRef.current) { handlerRef.current.destroy(); handlerRef.current = null; }
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(click.position);
      const siteId = getPickedSiteId(picked);
      onSelectSite(siteId ? siteLookupRef.current.get(siteId) ?? null : null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handlerRef.current = handler;
    return () => { if (handlerRef.current) { handlerRef.current.destroy(); handlerRef.current = null; } };
  }, [onSelectSite, viewer]);

  // 3D tower entities — swap pattern: new entities added before old ones removed, so no gap
  useEffect(() => {
    if (!viewer) return;

    const detailedSites = detailedSiteIds
      .map((id) => siteLookupRef.current.get(id))
      .filter((s): s is SitefinderTowerSite => Boolean(s));

    if (detailedSites.length === 0) {
      const prev = entitiesRef.current;
      entitiesRef.current = [];
      if (!viewer.isDestroyed()) prev.forEach((e) => viewer.entities.remove(e));
      return;
    }

    let active = true;

    const build = (cache: Map<string, number>) => {
      if (!active) return;

      const fresh: Cesium.Entity[] = [];
      detailedSites.forEach((site) => {
        fresh.push(
          ...buildTowerEntities(viewer, site, selectedSiteId === site.id, cache.get(site.id) ?? 0)
        );
      });

      if (!active) {
        // Cancelled between building and swapping — remove the freshly added entities
        if (!viewer.isDestroyed()) fresh.forEach((e) => viewer.entities.remove(e));
        return;
      }

      // Swap: old entities stay visible until this point, so there's no empty frame
      const prev = entitiesRef.current;
      entitiesRef.current = fresh;
      if (!viewer.isDestroyed()) prev.forEach((e) => viewer.entities.remove(e));
    };

    const uncached = detailedSites.filter((s) => !terrainCacheRef.current.has(s.id));

    if (uncached.length === 0) {
      // All terrain heights already known — build synchronously, no async gap
      build(terrainCacheRef.current);
    } else {
      (async () => {
        const newHeights = await sampleSiteHeights(viewer, uncached);
        if (!active) return;
        newHeights.forEach((h, id) => terrainCacheRef.current.set(id, h));
        build(terrainCacheRef.current);
      })();
    }

    return () => {
      // Mark cancelled so any in-flight async skips the swap.
      // Do NOT remove entitiesRef.current here — the next effect run will swap them out
      // without leaving an empty frame. The viewer-level cleanup effect handles unmount.
      active = false;
    };
  }, [detailedSiteIds, selectedSiteId, viewer]);

  // Final cleanup when viewer goes away (component unmount or viewer destroyed)
  useEffect(() => {
    if (!viewer) return;
    return () => {
      if (viewer.isDestroyed()) return;
      entitiesRef.current.forEach((e) => viewer.entities.remove(e));
      entitiesRef.current = [];
      if (pointCollectionRef.current) {
        viewer.scene.primitives.remove(pointCollectionRef.current);
        pointCollectionRef.current = null;
      }
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [viewer]);

  return null;
}
