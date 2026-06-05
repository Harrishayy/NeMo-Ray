'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import MapCanvas from '@/components/map/MapCanvas';
import BuildingLayer from '@/components/map/BuildingLayer';
import TerrainLayer from '@/components/map/TerrainLayer';
import CoverageHeatmap from '@/components/map/CoverageHeatmap';
import MastMarkers from '@/components/map/MastMarkers';
import DeadZoneLayer from '@/components/map/DeadZoneLayer';
import ProposalColumns from '@/components/map/ProposalColumns';
import AgentPanel from '@/components/map/AgentPanel';
import { useAgentCamera } from '@/hooks/useAgentCamera';
import { generateRadioMap, LONDON_DEAD_ZONES } from '@/lib/data/mockSionna';
import { generateMastSites } from '@/lib/data/mockCellTowers';
import { generateProposals } from '@/lib/data/mockProposals';
import { proposalEventBus } from '@/lib/agent/proposalEventBus';
import type { MapInstance } from '@/lib/deck/_coverageStub';

// Generate all mock data once at module level — seeded so no randomness on re-render
const radioMap = generateRadioMap(42);
const mastSites = generateMastSites(50);
const deadZones = LONDON_DEAD_ZONES;
const proposals = generateProposals(deadZones);

export default function MapPage() {
  const mapRef = useRef<MapRef | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<MapInstance | null>(null);

  const { flyToProposal, flyToOverview } = useAgentCamera(mapRef);

  // Stable callback for AgentPanel — wraps flyToProposal, ignores the index param
  const handleFlyToProposal = useCallback(
    (proposal: { lat: number; lng: number }, _index: number) => {
      flyToProposal(proposal, 'INSPECT');
    },
    [flyToProposal],
  );

  const handleLoad = useCallback(() => {
    const raw = mapRef.current?.getMap();
    if (raw) {
      setMapInstance(raw as unknown as MapInstance);
    }
    setMapLoaded(true);
  }, []);

  // Fly to overview once on initial map load
  useEffect(() => {
    if (mapLoaded) {
      flyToOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // Subscribe to SSE stream from /api/proposals/stream and feed into the event bus
  useEffect(() => {
    const es = new EventSource('/api/proposals/stream');
    es.onmessage = (e: MessageEvent<string>) => {
      try {
        proposalEventBus.emit(JSON.parse(e.data));
      } catch {
        // malformed JSON — ignore
      }
    };
    return () => es.close();
  }, []);

  // Memoize the data arrays passed to deck.gl layers — avoids re-creating layer objects
  const coveragePoints = useMemo(() => radioMap.points, []);
  const mastSitesMemo = useMemo(() => mastSites, []);
  const deadZonesMemo = useMemo(() => deadZones, []);
  const proposalsMemo = useMemo(() => proposals, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapCanvas mapRef={mapRef} onLoad={handleLoad}>
        {/* BuildingLayer and TerrainLayer use useMap() — must be inside MapCanvas */}
        <BuildingLayer />
        <TerrainLayer />
      </MapCanvas>

      {/* deck.gl overlay components — need the underlying map instance; mount after load */}
      {mapLoaded && (
        <>
          <CoverageHeatmap points={coveragePoints} map={mapInstance} />
          <MastMarkers sites={mastSitesMemo} map={mapInstance} />
          <DeadZoneLayer deadZones={deadZonesMemo} map={mapInstance} />
          <ProposalColumns proposals={proposalsMemo} map={mapInstance} />
        </>
      )}

      <AgentPanel
        proposals={proposalsMemo}
        onFlyToProposal={handleFlyToProposal}
        onOverview={flyToOverview}
      />
    </div>
  );
}
