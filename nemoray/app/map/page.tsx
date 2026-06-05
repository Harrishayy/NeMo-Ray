import MapCanvas from '@/components/map/MapCanvas';
import BuildingLayer from '@/components/map/BuildingLayer';
import TerrainLayer from '@/components/map/TerrainLayer';

export default function MapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapCanvas>
        <BuildingLayer />
        <TerrainLayer />
      </MapCanvas>
    </div>
  );
}
