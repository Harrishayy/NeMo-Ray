import type { PathId, SignalAlert, SignalSimulationSource } from './types';
import type * as Cesium from 'cesium';

export interface SignalPathLayerOptions {
  viewer: Cesium.Viewer;
  source: SignalSimulationSource;   // inject MockSimulationSource for the demo
  showParticles?: boolean;
}

export interface SignalPathLayer {
  start(): void;
  stop(): void;
  destroy(): void;
  setUtilisation(pathId: PathId, value: number): void;  // manual override / debug
  triggerAlert(alert: SignalAlert): void;
}
