'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Cesium from 'cesium';
import CesiumViewer, { cesiumViewerRef } from './CesiumViewer';
import PhotorealisticTiles from './PhotorealisticTiles';
import SitefinderTowerLayer from './SitefinderTowerLayer';
import { useCesiumCamera } from '@/hooks/useCesiumCamera';
import { useSitefinderSelection } from '@/hooks/useSitefinderSelection';
import CesiumPostProcess from './CesiumPostProcess';
import type { SitefinderPayload, SitefinderTowerSite, TransmissionType } from '@/types/sitefinder';

const TRANSMISSION_FILTERS: TransmissionType[] = ['GSM', 'UMTS', 'TETRA', 'GSM-R', 'LTE', 'UNKNOWN'];

export default function CesiumMapWrapper() {
  const { flyToLondon, flyToSite } = useCesiumCamera(cesiumViewerRef as React.MutableRefObject<Cesium.Viewer | null>);
  const { selectedSite, setSelectedSite, clearSelectedSite } = useSitefinderSelection();
  const [sitefinder, setSitefinder] = useState<SitefinderPayload | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<TransmissionType>>(
    () => new Set(['GSM', 'UMTS', 'TETRA', 'GSM-R', 'LTE'])
  );
  const [operator, setOperator] = useState('all');
  const sitefinderSites = useMemo(() => {
    const allSites = sitefinder?.sites ?? [];
    return operator === 'all' ? allSites : allSites.filter((site) => site.operators.includes(operator));
  }, [operator, sitefinder]);
  const operators = sitefinder?.operators ?? [];

  const handleReady = () => {
    flyToLondon();
  };

  const handleSelectSite = useCallback(
    (site: SitefinderTowerSite | null) => {
      setSelectedSite(site);
      if (site) {
        flyToSite(site, 'inspect');
      }
    },
    [flyToSite, setSelectedSite]
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sitefinder')
      .then((response) => {
        if (!response.ok) throw new Error(`Sitefinder request failed: ${response.status}`);
        return response.json() as Promise<SitefinderPayload>;
      })
      .then((payload) => {
        if (!cancelled) setSitefinder(payload);
      })
      .catch((error) => {
        console.error('Unable to load Sitefinder dataset', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleType = (type: TransmissionType) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#030a18' }}>
      <CesiumViewer
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        onReady={handleReady}
      >
        <PhotorealisticTiles />
        <SitefinderTowerLayer
          sites={sitefinderSites}
          activeTypes={activeTypes}
          selectedSiteId={selectedSite?.id ?? null}
          onSelectSite={handleSelectSite}
        />
        <CesiumPostProcess />
      </CesiumViewer>
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 5,
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          color: '#e5f4ff',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 12,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            border: '1px solid rgba(148, 211, 255, 0.22)',
            background: 'rgba(3, 10, 24, 0.82)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: 10,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Sitefinder Towers</strong>
            <span style={{ color: '#8fb4c8' }}>{sitefinderSites.length.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {TRANSMISSION_FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                style={{
                  border: '1px solid rgba(148, 211, 255, 0.24)',
                  background: activeTypes.has(type) ? 'rgba(0, 212, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeTypes.has(type) ? '#dff9ff' : '#8ca6b8',
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, alignItems: 'center' }}>
            <select
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              style={{
                minWidth: 0,
                border: '1px solid rgba(148, 211, 255, 0.22)',
                background: '#071424',
                color: '#dff9ff',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
              }}
            >
              <option value="all">All operators</option>
              {operators.map((operatorName) => (
                <option key={operatorName} value={operatorName}>
                  {operatorName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSite && (
          <div
            style={{
              border: '1px solid rgba(0, 255, 195, 0.28)',
              background: 'rgba(3, 10, 24, 0.88)',
              backdropFilter: 'blur(10px)',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>{selectedSite.operator}</strong>
              <button
                type="button"
                onClick={clearSelectedSite}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#9fbace',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label="Clear tower selection"
              >
                x
              </button>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: '86px 1fr', rowGap: 5, columnGap: 8, margin: 0 }}>
              <dt style={{ color: '#7f9daf' }}>Op ref</dt>
              <dd style={{ margin: 0 }}>{selectedSite.opref || 'Unknown'}</dd>
              <dt style={{ color: '#7f9daf' }}>NGR</dt>
              <dd style={{ margin: 0 }}>{selectedSite.siteNgr || 'Unknown'}</dd>
              <dt style={{ color: '#7f9daf' }}>Antennas</dt>
              <dd style={{ margin: 0 }}>{selectedSite.transmissionCount}</dd>
              <dt style={{ color: '#7f9daf' }}>Height</dt>
              <dd style={{ margin: 0 }}>
                {selectedSite.minAntennaHeightMeters ?? '?'}-{selectedSite.maxAntennaHeightMeters ?? '?'} m
              </dd>
              <dt style={{ color: '#7f9daf' }}>Bands</dt>
              <dd style={{ margin: 0 }}>{selectedSite.frequencyBands.join(', ') || 'Unknown'}</dd>
              <dt style={{ color: '#7f9daf' }}>Power</dt>
              <dd style={{ margin: 0 }}>
                {selectedSite.minPowerDbw ?? '?'}-{selectedSite.maxPowerDbw ?? '?'} dBW
              </dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
