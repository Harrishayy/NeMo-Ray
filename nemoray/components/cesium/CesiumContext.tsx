'use client';

import * as Cesium from 'cesium';
import { createContext, useContext } from 'react';

export const CesiumContext = createContext<Cesium.Viewer | null>(null);

export function useCesiumViewer(): Cesium.Viewer | null {
  return useContext(CesiumContext);
}
