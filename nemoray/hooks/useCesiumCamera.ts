'use client';
import React, { useRef, useEffect, useCallback } from 'react';
import * as Cesium from 'cesium';
import { CesiumCameraController, ProposalEvent } from '@/lib/cesium/camera/CesiumCameraController';

export function useCesiumCamera(viewerRef: React.MutableRefObject<Cesium.Viewer | null>) {
  const controllerRef = useRef<CesiumCameraController | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (viewerRef.current && !controllerRef.current) {
        controllerRef.current = new CesiumCameraController(viewerRef.current);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const flyToLondon = useCallback(() => {
    controllerRef.current?.flyToLondon();
  }, []);

  const flyToSite = useCallback(
    (site: { lat: number; lng: number }, mode: 'inspect' | 'overview') => {
      controllerRef.current?.flyToSite(site, mode);
    },
    []
  );

  const flyToProposal = useCallback((p: { lat: number; lng: number; accepted: boolean }) => {
    controllerRef.current?.flyToProposal(p);
  }, []);

  const startOrbit = useCallback(
    (lat: number, lng: number, alt: number, period: number): (() => void) => {
      return controllerRef.current?.startOrbit(lat, lng, alt, period) ?? (() => {});
    },
    []
  );

  const fitLondonBounds = useCallback(() => {
    controllerRef.current?.fitLondonBounds();
  }, []);

  const onProposalEvent = useCallback((e: ProposalEvent) => {
    if (e.type === 'accepted' && e.proposal) {
      controllerRef.current?.flyToProposal(e.proposal);
    } else if (e.type === 'rejected' && e.proposal) {
      controllerRef.current?.flyToProposal(e.proposal);
    } else if (e.type === 'overview') {
      controllerRef.current?.flyToLondon();
    }
  }, []);

  return {
    flyToLondon,
    flyToSite,
    flyToProposal,
    startOrbit,
    fitLondonBounds,
    onProposalEvent,
  };
}
