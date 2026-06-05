'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
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
  const handleFlyToProposal = useMemo(
    () => (proposal: { lat: number; lng: number }, _index: number) => {
      flyToProposal(proposal, 'INSPECT');
    },
    [flyToProposal],
  );

  function handleLoad() {
    const raw = mapRef.current?.getMap();
    if (raw) {
      // maplibre-gl Map satisfies MapInstance (addControl / removeControl shape)
      setMapInstance(raw as unknown as MapInstance);
    }
    setMapLoaded(true);
  }

  // Fly to overview once on initial map load
  useEffect(() => {
    if (mapLoaded) {
      flyToOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

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
          <CoverageHeatmap points={radioMap.points} map={mapInstance} />
          <MastMarkers sites={mastSites} map={mapInstance} />
          <DeadZoneLayer deadZones={deadZones} map={mapInstance} />
          <ProposalColumns proposals={proposals} map={mapInstance} />
        </>
      )}

      <AgentPanel
        proposals={proposals}
        onFlyToProposal={handleFlyToProposal}
        onOverview={flyToOverview}
      />
    </div>
  );
}
