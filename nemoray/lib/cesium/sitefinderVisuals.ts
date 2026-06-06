import * as Cesium from 'cesium';
import type { SitefinderTowerSite, TransmissionType } from '@/types/sitefinder';

const TYPE_COLORS: Record<TransmissionType, string> = {
  GSM: '#ffdc4a',
  UMTS: '#ff7a2f',
  TETRA: '#36d7ff',
  'GSM-R': '#7cff7c',
  LTE: '#ff4fa3',
  UNKNOWN: '#94a3b8',
};

export function getTransmissionColorCss(type: TransmissionType, frequencyBand = ''): string {
  const band = frequencyBand.toLowerCase();
  if (type !== 'UNKNOWN') return TYPE_COLORS[type];
  if (band.includes('400')) return TYPE_COLORS.TETRA;
  if (band.includes('900') || band.includes('1800')) return TYPE_COLORS.GSM;
  if (band.includes('2100')) return TYPE_COLORS.UMTS;
  return TYPE_COLORS.UNKNOWN;
}

export function getTransmissionColor(type: TransmissionType, frequencyBand = '', alpha = 1): Cesium.Color {
  return Cesium.Color.fromCssColorString(getTransmissionColorCss(type, frequencyBand)).withAlpha(alpha);
}

export function clampMastHeight(heightMeters: number | null): number {
  if (heightMeters === null || !Number.isFinite(heightMeters)) return 36;
  return Math.max(16, Math.min(120, heightMeters));
}

export function calculateFootprintRadiusMeters(powerDbw: number | null): number {
  if (powerDbw === null || !Number.isFinite(powerDbw)) return 650;
  const clampedPower = Math.max(0, Math.min(45, powerDbw));
  return Math.round(250 + Math.log2(clampedPower + 1) * 430);
}

export function getSitePrimaryColor(site: SitefinderTowerSite, alpha = 1): Cesium.Color {
  return getTransmissionColor(site.transmissionTypes[0] ?? 'UNKNOWN', site.frequencyBands[0] ?? '', alpha);
}

export function getSiteVisualHeight(site: SitefinderTowerSite): number {
  return clampMastHeight(site.maxAntennaHeightMeters);
}
