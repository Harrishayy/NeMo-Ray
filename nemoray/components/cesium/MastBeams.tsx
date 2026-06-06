'use client';

import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCesiumViewer } from './CesiumContext';
import type { MastSite } from '@/types/coverage';

interface MastBeamsProps {
  sites: MastSite[];
}

export default function MastBeams({ sites }: MastBeamsProps): null {
  const viewer = useCesiumViewer();
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!viewer) return;

    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];
    listenerRef.current?.();
    listenerRef.current = null;

    sites.forEach((site) => {
      const baseColor = site.active
        ? Cesium.Color.fromCssColorString('#00ffc3').withAlpha(0.9)
        : Cesium.Color.fromCssColorString('#ff4444').withAlpha(0.7);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 60),
        cylinder: {
          length: 120,
          topRadius: 0,
          bottomRadius: 8,
          material: new Cesium.ColorMaterialProperty(baseColor),
          outline: false,
        },
      });

      entitiesRef.current.push(entity);
    });

    // Pulse animation: oscillate alpha between 0.7 and 1.0 at 1.5 Hz
    const removeListener = viewer.scene.postRender.addEventListener(() => {
      const t = Date.now() / 1000;
      const alpha = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t));
      entitiesRef.current.forEach((entity, idx) => {
        const site = sites[idx];
        if (!site || !entity.cylinder) return;
        const baseColorStr = site.active ? '#00ffc3' : '#ff4444';
        const pulsed = Cesium.Color.fromCssColorString(baseColorStr).withAlpha(alpha);
        (entity.cylinder.material as Cesium.ColorMaterialProperty) =
          new Cesium.ColorMaterialProperty(pulsed);
      });
    });

    listenerRef.current = removeListener;

    return () => {
      entitiesRef.current.forEach((e) => viewer.entities.remove(e));
      entitiesRef.current = [];
      listenerRef.current?.();
      listenerRef.current = null;
    };
  }, [viewer, sites]);

  return null;
}
