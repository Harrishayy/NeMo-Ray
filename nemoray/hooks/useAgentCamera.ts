'use client';
import { useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { CameraController } from '../lib/camera/CameraController';
import type { PresetName } from '../lib/camera/transitions';

export type ProposalCameraEvent =
  | { type: 'accepted'; proposal: { lat: number; lng: number } }
  | { type: 'rejected'; proposal: { lat: number; lng: number } }
  | { type: 'overview' };

export function useAgentCamera(mapRef: React.RefObject<MapRef | null>) {
  const controllerRef = useRef<CameraController | null>(null);

  function getController(): CameraController {
    if (!controllerRef.current) {
      controllerRef.current = new CameraController(mapRef);
    }
    return controllerRef.current;
  }

  const flyToProposal = useCallback(
    (proposal: { lat: number; lng: number }, preset: PresetName = 'INSPECT') =>
      getController().flyToProposal(proposal, preset),
    []
  );

  const flyToOverview = useCallback(() => getController().flyToOverview(), []);

  const orbit = useCallback((durationMs: number) => getController().orbit(durationMs), []);

  const fitBounds = useCallback(
    (bbox: [[number, number], [number, number]]) => getController().fitBounds(bbox),
    []
  );

  const onProposalEvent = useCallback((event: ProposalCameraEvent) => {
    const ctrl = getController();
    if (event.type === 'accepted' && event.proposal) {
      ctrl.flyToProposal(event.proposal, 'INSPECT');
    } else if (event.type === 'rejected' && event.proposal) {
      ctrl.flyToProposal(event.proposal, 'REJECTED_ZOOM');
    } else if (event.type === 'overview') {
      ctrl.flyToOverview();
    }
  }, []);

  return {
    controller: getController(),
    flyToProposal,
    flyToOverview,
    orbit,
    fitBounds,
    onProposalEvent,
  };
}
