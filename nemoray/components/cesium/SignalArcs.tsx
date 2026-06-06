'use client';
import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { cesiumViewerRef } from './CesiumViewer';
import type { MastSite } from '@/types/coverage';
import { createSignalArc } from '@/lib/cesium/primitives/arcPrimitive';

interface SignalArcsProps {
  sites: MastSite[];
}

interface ArcRecord {
  entity: Cesium.Entity;
  positions: Cesium.Cartesian3[];
}

export default function SignalArcs({ sites }: SignalArcsProps): null {
  const arcsRef = useRef<ArcRecord[]>([]);
  const listenerRef = useRef<(() => void) | null>(null);
  const packetCollectionRef = useRef<Cesium.PointPrimitiveCollection | null>(null);

  useEffect(() => {
    const viewer = cesiumViewerRef.current;
    if (!viewer) return;

    // Cleanup previous state
    arcsRef.current.forEach(({ entity }) => viewer.entities.remove(entity));
    arcsRef.current = [];
    if (listenerRef.current) {
      listenerRef.current();
      listenerRef.current = null;
    }
    if (packetCollectionRef.current) {
      viewer.scene.primitives.remove(packetCollectionRef.current);
      packetCollectionRef.current = null;
    }

    // Find adjacent pairs within 5 km, limited to 40
    const pairs: Array<{ a: MastSite; b: MastSite }> = [];
    for (let i = 0; i < sites.length && pairs.length < 40; i++) {
      for (let j = i + 1; j < sites.length && pairs.length < 40; j++) {
        const posA = Cesium.Cartesian3.fromDegrees(sites[i].lng, sites[i].lat);
        const posB = Cesium.Cartesian3.fromDegrees(sites[j].lng, sites[j].lat);
        const dist = Cesium.Cartesian3.distance(posA, posB);
        if (dist < 5000) {
          pairs.push({ a: sites[i], b: sites[j] });
        }
      }
    }

    // Build arc entities and sample positions for packet animation
    pairs.forEach(({ a, b }) => {
      const color =
        a.active && b.active
          ? Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.6)
          : Cesium.Color.fromCssColorString('#ff6600').withAlpha(0.5);

      const entity = createSignalArc(viewer, a, b, color);

      // Re-derive the 32 sampled positions for packet animation
      const startPos = Cesium.Cartesian3.fromDegrees(a.lng, a.lat, 80);
      const endPos = Cesium.Cartesian3.fromDegrees(b.lng, b.lat, 80);
      const distance = Cesium.Cartesian3.distance(startPos, endPos);
      const midElevation = Math.min(Math.max(distance * 0.3, 800), 1500);
      const midPos = Cesium.Cartesian3.fromDegrees(
        (a.lng + b.lng) / 2,
        (a.lat + b.lat) / 2,
        midElevation
      );

      const spline = new Cesium.CatmullRomSpline({
        times: [0, 0.5, 1],
        points: [startPos, midPos, endPos],
      });

      const positions: Cesium.Cartesian3[] = [];
      for (let i = 0; i < 32; i++) {
        positions.push(spline.evaluate(i / 31));
      }

      arcsRef.current.push({ entity, positions });
    });

    // Create a PointPrimitiveCollection for data-packet dots
    const pointCollection = new Cesium.PointPrimitiveCollection();
    viewer.scene.primitives.add(pointCollection);
    packetCollectionRef.current = pointCollection;

    // Each arc gets one "packet" point; track state per arc
    interface PacketState {
      point: Cesium.PointPrimitive;
      positions: Cesium.Cartesian3[];
      startTime: number; // ms, when this packet's current trip started
      nextSpawnTime: number; // ms, when to next start a trip
    }

    const packetStates: PacketState[] = arcsRef.current.map(({ positions }) => {
      const point = pointCollection.add({
        position: positions[0],
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0),
        show: false,
      });
      const now = Date.now();
      return {
        point,
        positions,
        startTime: -1,
        nextSpawnTime: now + Math.random() * 4000,
      };
    });

    // postRender listener: pulse glow + packet animation
    const TRIP_DURATION_MS = 2000;
    const RESPAWN_INTERVAL_MS = 4000;

    const removeListener = viewer.scene.postRender.addEventListener(() => {
      const now = Date.now();
      const t = now / 1000;

      // Pulse glow on arc entities at 0.8 Hz
      const glowPower = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.8 * t));
      arcsRef.current.forEach(({ entity }) => {
        if (!entity.polyline) return;
        const mat = entity.polyline.material as Cesium.PolylineGlowMaterialProperty;
        mat.glowPower = new Cesium.ConstantProperty(glowPower);
      });

      // Data-packet animation
      packetStates.forEach((state) => {
        if (state.startTime < 0) {
          // Packet not yet travelling
          if (now >= state.nextSpawnTime) {
            state.startTime = now;
            state.point.show = true;
          } else {
            return;
          }
        }

        const elapsed = now - state.startTime;
        if (elapsed >= TRIP_DURATION_MS) {
          // Trip finished — hide and schedule next spawn
          state.point.show = false;
          state.point.color = Cesium.Color.fromCssColorString('#ffffff').withAlpha(0);
          state.startTime = -1;
          state.nextSpawnTime = now + RESPAWN_INTERVAL_MS;
          return;
        }

        const progress = elapsed / TRIP_DURATION_MS; // 0..1
        const posIdx = Math.min(Math.floor(progress * 32), 31);
        state.point.position = state.positions[posIdx];

        // Fade in for first 20%, fade out for last 20%
        let alpha = 1;
        if (progress < 0.2) {
          alpha = progress / 0.2;
        } else if (progress > 0.8) {
          alpha = (1 - progress) / 0.2;
        }
        state.point.color = Cesium.Color.fromCssColorString('#00d4ff').withAlpha(alpha);
      });
    });

    listenerRef.current = removeListener;

    return () => {
      arcsRef.current.forEach(({ entity }) => viewer.entities.remove(entity));
      arcsRef.current = [];
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
      if (packetCollectionRef.current) {
        viewer.scene.primitives.remove(packetCollectionRef.current);
        packetCollectionRef.current = null;
      }
    };
  }, [sites]);

  return null;
}
