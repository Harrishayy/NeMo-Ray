import fs from 'node:fs';
import path from 'node:path';
import type {
  RawSitefinderRow,
  SitefinderPayload,
  SitefinderTowerSite,
  SitefinderTransmission,
  TransmissionType,
} from '@/types/sitefinder';

const DATASET_PATH = path.join(process.cwd(), 'data', 'sitefinder-london-eeproxy.csv');
const HEADERS: Array<keyof RawSitefinderRow> = [
  'Operator',
  'Opref',
  'Sitengr',
  'Antennaht',
  'Transtype',
  'Freqband',
  'Powerdbw',
  'Maxpwrdbw',
  'Maxpwrdbm',
  'Sitelat',
  'Sitelng',
];

export interface SitefinderFilters {
  operator?: string;
  transtype?: TransmissionType;
  limit?: number;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTransmissionType(value: string): TransmissionType {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'GSM') return 'GSM';
  if (normalized === 'UMTS') return 'UMTS';
  if (normalized === 'TETRA') return 'TETRA';
  if (normalized === 'GSM-R' || normalized === 'GSMR') return 'GSM-R';
  if (normalized === 'LTE') return 'LTE';
  return 'UNKNOWN';
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function makeSiteKey(row: RawSitefinderRow, lat: number, lng: number): string {
  const ref = `${row.Opref.trim()}-${row.Sitengr.trim()}`.replace(/^-|-$/g, '');
  if (ref) return ref;
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function toRawRows(csv: string): RawSitefinderRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return HEADERS.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {} as RawSitefinderRow);
  });
}

export function parseSitefinderCsv(csv: string): SitefinderPayload {
  const rows = toRawRows(csv);
  const transmissions: SitefinderTransmission[] = [];
  const groups = new Map<string, SitefinderTransmission[]>();

  rows.forEach((row, index) => {
    const lat = parseNumber(row.Sitelat);
    const lng = parseNumber(row.Sitelng);
    if (lat === null || lng === null) return;

    const siteKey = makeSiteKey(row, lat, lng);
    const siteId = `sitefinder-${slug(siteKey)}`;
    const transmission: SitefinderTransmission = {
      id: `${siteId}-${index}`,
      siteId,
      operator: row.Operator.trim() || 'Unknown',
      opref: row.Opref.trim(),
      siteNgr: row.Sitengr.trim(),
      antennaHeightMeters: parseNumber(row.Antennaht),
      transmissionType: normalizeTransmissionType(row.Transtype),
      rawTransmissionType: row.Transtype.trim(),
      frequencyBand: row.Freqband.trim(),
      powerDbw: parseNumber(row.Powerdbw),
      maxPowerDbw: parseNumber(row.Maxpwrdbw),
      maxPowerDbm: parseNumber(row.Maxpwrdbm),
      lat,
      lng,
    };

    transmissions.push(transmission);
    const existing = groups.get(siteId) ?? [];
    existing.push(transmission);
    groups.set(siteId, existing);
  });

  const sites = Array.from(groups.entries()).map(([id, siteTransmissions]): SitefinderTowerSite => {
    const heights = siteTransmissions
      .map((transmission) => transmission.antennaHeightMeters)
      .filter((height): height is number => height !== null);
    const powers = siteTransmissions
      .map((transmission) => transmission.powerDbw)
      .filter((power): power is number => power !== null);
    const operators = Array.from(new Set(siteTransmissions.map((transmission) => transmission.operator))).sort();
    const transmissionTypes = Array.from(
      new Set(siteTransmissions.map((transmission) => transmission.transmissionType))
    ).sort();
    const frequencyBands = Array.from(
      new Set(siteTransmissions.map((transmission) => transmission.frequencyBand).filter(Boolean))
    ).sort((a, b) => Number(a) - Number(b));

    return {
      id,
      operator: operators[0] ?? 'Unknown',
      operators,
      opref: siteTransmissions[0].opref,
      siteNgr: siteTransmissions[0].siteNgr,
      lat: siteTransmissions[0].lat,
      lng: siteTransmissions[0].lng,
      transmissionTypes,
      frequencyBands,
      minAntennaHeightMeters: heights.length ? Math.min(...heights) : null,
      maxAntennaHeightMeters: heights.length ? Math.max(...heights) : null,
      minPowerDbw: powers.length ? Math.min(...powers) : null,
      maxPowerDbw: powers.length ? Math.max(...powers) : null,
      transmissionCount: siteTransmissions.length,
      transmissions: siteTransmissions,
    };
  });

  sites.sort((a, b) => (b.maxPowerDbw ?? -Infinity) - (a.maxPowerDbw ?? -Infinity));

  return {
    sites,
    transmissions,
    operators: Array.from(new Set(sites.flatMap((site) => site.operators))).sort(),
    transmissionTypes: Array.from(new Set(transmissions.map((transmission) => transmission.transmissionType))).sort(),
    totalRows: rows.length,
    validRows: transmissions.length,
  };
}

export function filterSitefinderPayload(
  payload: SitefinderPayload,
  filters: SitefinderFilters = {}
): SitefinderPayload {
  const filteredSites = payload.sites
    .filter((site) => !filters.operator || site.operators.includes(filters.operator))
    .filter((site) => !filters.transtype || site.transmissionTypes.includes(filters.transtype))
    .slice(0, filters.limit);
  const siteIds = new Set(filteredSites.map((site) => site.id));
  const transmissions = payload.transmissions.filter((transmission) => siteIds.has(transmission.siteId));

  return {
    ...payload,
    sites: filteredSites,
    transmissions,
    operators: Array.from(new Set(filteredSites.flatMap((site) => site.operators))).sort(),
    transmissionTypes: Array.from(new Set(transmissions.map((transmission) => transmission.transmissionType))).sort(),
  };
}

let cachedPayload: SitefinderPayload | null = null;

export function loadSitefinderPayload(): SitefinderPayload {
  if (!cachedPayload) {
    cachedPayload = parseSitefinderCsv(fs.readFileSync(DATASET_PATH, 'utf8'));
  }
  return cachedPayload;
}
