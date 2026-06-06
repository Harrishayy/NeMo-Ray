'use client';
import { useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { CameraController } from '../lib/camera/CameraController';
import type { PresetName } from '../lib/camera/transitions';

export type { ProposalCameraEvent } from '../lib/agent/proposalEventBus';

export function useAgentCamera(mapRef: React.RefObject<MapRef | null>) {
  const controllerRef = useRef<CameraController | null>(null);

  const getController = useCallback((): CameraController => {
    if (!controllerRef.current) {
      controllerRef.current = new CameraController(mapRef);
    }
    return controllerRef.current;
  }, [mapRef]);

  const flyToProposal = useCallback(
    (proposal: { lat: number; lng: number }, preset: PresetName = 'INSPECT') =>
      getController().flyToProposal(proposal, preset),
    [getController]
  );

  const flyToOverview = useCallback(() => getController().flyToOverview(), [getController]);

  const orbit = useCallback((durationMs: number) => getController().orbit(durationMs), [getController]);

  const fitBounds = useCallback(
    (bbox: [[number, number], [number, number]]) => getController().fitBounds(bbox),
    [getController]
  );

  return {
    flyToProposal,
    flyToOverview,
    orbit,
    fitBounds,
  };
}
