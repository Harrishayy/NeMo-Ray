export type TransmissionType = 'GSM' | 'UMTS' | 'TETRA' | 'GSM-R' | 'LTE' | 'UNKNOWN';

export interface RawSitefinderRow {
  Operator: string;
  Opref: string;
  Sitengr: string;
  Antennaht: string;
  Transtype: string;
  Freqband: string;
  Powerdbw: string;
  Maxpwrdbw: string;
  Maxpwrdbm: string;
  Sitelat: string;
  Sitelng: string;
}

export interface SitefinderTransmission {
  id: string;
  siteId: string;
  operator: string;
  opref: string;
  siteNgr: string;
  antennaHeightMeters: number | null;
  transmissionType: TransmissionType;
  rawTransmissionType: string;
  frequencyBand: string;
  powerDbw: number | null;
  maxPowerDbw: number | null;
  maxPowerDbm: number | null;
  lat: number;
  lng: number;
}

export interface SitefinderTowerSite {
  id: string;
  operator: string;
  operators: string[];
  opref: string;
  siteNgr: string;
  lat: number;
  lng: number;
  transmissionTypes: TransmissionType[];
  frequencyBands: string[];
  minAntennaHeightMeters: number | null;
  maxAntennaHeightMeters: number | null;
  minPowerDbw: number | null;
  maxPowerDbw: number | null;
  transmissionCount: number;
  transmissions: SitefinderTransmission[];
}

export interface SitefinderPayload {
  sites: SitefinderTowerSite[];
  transmissions: SitefinderTransmission[];
  operators: string[];
  transmissionTypes: TransmissionType[];
  totalRows: number;
  validRows: number;
}
