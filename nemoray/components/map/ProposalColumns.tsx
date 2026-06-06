'use client';

import { useEffect, useRef } from 'react';
import { ColumnLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Proposal } from '../../types/coverage';
import type { MapInstance } from '../../lib/deck/_coverageStub';

interface ProposalColumnsProps {
  proposals: Proposal[];
  map: MapInstance | null;
}

function buildLayers(data: Proposal[]) {
  const accepted = data.filter((p) => p.accepted);
  const rejected = data.filter((p) => !p.accepted);

  return [
    new ColumnLayer<Proposal>({
      id: 'proposal-columns-accepted',
      data: accepted,
      getPosition: (d: Proposal) => [d.lng, d.lat],
      getFillColor: [0, 200, 100, 200],
      diskResolution: 12,
      radius: 120,
      extruded: true,
      getElevation: (d: Proposal) => d.score * 200,
      pickable: true,
    }),
    new ColumnLayer<Proposal>({
      id: 'proposal-columns-rejected',
      data: rejected,
      getPosition: (d: Proposal) => [d.lng, d.lat],
      getFillColor: [220, 50, 50, 200],
      diskResolution: 12,
      radius: 120,
      extruded: false,
      getElevation: 0,
      pickable: true,
    }),
  ];
}

export default function ProposalColumns({ proposals, map }: ProposalColumnsProps) {
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: buildLayers(proposals) });
    map.addControl(overlay);
    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current);
        overlayRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setProps({ layers: buildLayers(proposals) });
  }, [proposals]);

  return null;
}
