'use client';

import { useMemo, useState } from 'react';
import type { SitefinderTowerSite } from '@/types/sitefinder';

export interface SitefinderInferenceRequest {
  siteId: string;
  lat: number;
  lng: number;
  heightMeters: number | null;
  transmissions: SitefinderTowerSite['transmissions'];
}

export function useSitefinderSelection() {
  const [selectedSite, setSelectedSite] = useState<SitefinderTowerSite | null>(null);

  const inferenceRequest = useMemo<SitefinderInferenceRequest | null>(() => {
    if (!selectedSite) return null;
    return {
      siteId: selectedSite.id,
      lat: selectedSite.lat,
      lng: selectedSite.lng,
      heightMeters: selectedSite.maxAntennaHeightMeters,
      transmissions: selectedSite.transmissions,
    };
  }, [selectedSite]);

  return {
    selectedSite,
    setSelectedSite,
    clearSelectedSite: () => setSelectedSite(null),
    inferenceRequest,
  };
}
