import { lngLatToNorm } from "@/lib/geo/bbox";
import type { LngLat, Operator, Site, SiteId } from "@/lib/types";

interface RawSite {
  id: string;
  name: string;
  position: LngLat;
  operator: Operator;
  band: string;
  heightM: number;
  txPowerDbm: number;
  load: number;
  backhaulTargetId?: SiteId;
}

/** ~16 hand-placed sites across central London (EE 4G carrying ESN). */
const RAW: RawSite[] = [
  { id: "CLN-G01", name: "Westminster", position: [-0.1276, 51.4995], operator: "ESN", band: "B28", heightM: 38, txPowerDbm: 46, load: 142000 },
  { id: "CLN-G02", name: "City of London", position: [-0.0917, 51.5155], operator: "ESN", band: "B20", heightM: 52, txPowerDbm: 46, load: 168000 },
  { id: "CLN-G03", name: "Canary Wharf", position: [-0.0235, 51.5054], operator: "ESN", band: "B3", heightM: 64, txPowerDbm: 47, load: 151000 },
  { id: "CLN-G04", name: "Camden", position: [-0.1426, 51.539], operator: "EE", band: "B7", heightM: 31, txPowerDbm: 44, load: 88000, backhaulTargetId: "CLN-G11" },
  { id: "CLN-G05", name: "Shoreditch", position: [-0.0778, 51.5265], operator: "EE", band: "B3", heightM: 29, txPowerDbm: 44, load: 96000, backhaulTargetId: "CLN-G02" },
  { id: "CLN-G06", name: "Southwark", position: [-0.0959, 51.503], operator: "ESN", band: "B20", heightM: 34, txPowerDbm: 45, load: 74000, backhaulTargetId: "CLN-G01" },
  { id: "CLN-G07", name: "Kensington", position: [-0.1938, 51.4988], operator: "EE", band: "B1", heightM: 27, txPowerDbm: 43, load: 61000, backhaulTargetId: "CLN-G14" },
  { id: "CLN-G08", name: "Paddington", position: [-0.1759, 51.5154], operator: "ESN", band: "B28", heightM: 41, txPowerDbm: 46, load: 83000, backhaulTargetId: "CLN-G14" },
  { id: "CLN-G09", name: "Vauxhall", position: [-0.1234, 51.4861], operator: "EE", band: "B7", heightM: 33, txPowerDbm: 44, load: 57000, backhaulTargetId: "CLN-G01" },
  { id: "CLN-G10", name: "Islington", position: [-0.1031, 51.5362], operator: "EE", band: "B3", heightM: 30, txPowerDbm: 44, load: 69000, backhaulTargetId: "CLN-G11" },
  { id: "CLN-G11", name: "King's Cross", position: [-0.1233, 51.5308], operator: "ESN", band: "B20", heightM: 48, txPowerDbm: 47, load: 134000 },
  { id: "CLN-G12", name: "Whitechapel", position: [-0.061, 51.519], operator: "EE", band: "B1", heightM: 28, txPowerDbm: 43, load: 52000, backhaulTargetId: "CLN-G02" },
  { id: "CLN-G13", name: "Bermondsey", position: [-0.0648, 51.4979], operator: "EE", band: "B7", heightM: 26, txPowerDbm: 43, load: 44000, backhaulTargetId: "CLN-G03" },
  { id: "CLN-G14", name: "Maida Vale", position: [-0.1875, 51.526], operator: "ESN", band: "B28", heightM: 39, txPowerDbm: 46, load: 71000 },
  { id: "CLN-G15", name: "Brixton", position: [-0.1145, 51.4625], operator: "EE", band: "B20", heightM: 25, txPowerDbm: 43, load: 48000, backhaulTargetId: "CLN-G09" },
  { id: "CLN-G16", name: "Hackney", position: [-0.0553, 51.545], operator: "EE", band: "B3", heightM: 27, txPowerDbm: 43, load: 53000, backhaulTargetId: "CLN-G05" },
];

export const MOCK_SITES: Site[] = RAW.map((r) => ({
  ...r,
  placement: lngLatToNorm(r.position),
  tech: "LTE",
  azimuths: [0, 120, 240],
  coverageRadiusM: 1100 + (r.txPowerDbm - 43) * 280,
  status: "active",
}));

export const MOCK_SITES_BY_ID: Record<SiteId, Site> = Object.fromEntries(
  MOCK_SITES.map((s) => [s.id, s]),
);
