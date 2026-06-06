import { filterSitefinderPayload, parseSitefinderCsv } from '../lib/data/sitefinder';
import { calculateFootprintRadiusMeters, getTransmissionColorCss } from '../lib/cesium/sitefinderVisuals';

const CSV = `Operator,Opref,Sitengr,Antennaht,Transtype,Freqband,Powerdbw,Maxpwrdbw,Maxpwrdbm,Sitelat,Sitelng
Orange,ATN0051,TQ3225075840,20,GSM,1800,27.6,32,,51.46557,-0.095904
Orange,ATN0051,TQ3225075840,21,UMTS,2100,25.7,,65,51.46557,-0.095904
Vodafone,VF001,TQ0000000000,not-a-number,NR,3500,,,,51.5,-0.1
Broken,BAD,TQ9999999999,12,GSM,900,20,30,,not-lat,-0.2`;

describe('Sitefinder parser', () => {
  test('parses representative rows and drops invalid coordinates', () => {
    const payload = parseSitefinderCsv(CSV);

    expect(payload.totalRows).toBe(4);
    expect(payload.validRows).toBe(3);
    expect(payload.transmissions).toHaveLength(3);
    expect(payload.sites).toHaveLength(2);
  });

  test('groups physical rows with the same op ref and site NGR', () => {
    const payload = parseSitefinderCsv(CSV);
    const site = payload.sites.find((item) => item.opref === 'ATN0051');

    expect(site?.transmissionCount).toBe(2);
    expect(site?.transmissionTypes).toEqual(['GSM', 'UMTS']);
    expect(site?.minAntennaHeightMeters).toBe(20);
    expect(site?.maxAntennaHeightMeters).toBe(21);
  });

  test('handles blank power fields and unknown transmission types', () => {
    const payload = parseSitefinderCsv(CSV);
    const unknown = payload.transmissions.find((transmission) => transmission.opref === 'VF001');

    expect(unknown?.transmissionType).toBe('UNKNOWN');
    expect(unknown?.antennaHeightMeters).toBeNull();
    expect(unknown?.maxPowerDbm).toBeNull();
  });

  test('filters by operator, transmission type, and limit', () => {
    const payload = parseSitefinderCsv(CSV);
    const filtered = filterSitefinderPayload(payload, { operator: 'Orange', transtype: 'UMTS', limit: 1 });

    expect(filtered.sites).toHaveLength(1);
    expect(filtered.sites[0].operator).toBe('Orange');
    expect(filtered.sites[0].transmissionTypes).toContain('UMTS');
  });
});

describe('Sitefinder visual utilities', () => {
  test('maps known and inferred colors deterministically', () => {
    expect(getTransmissionColorCss('GSM')).toBe('#ffdc4a');
    expect(getTransmissionColorCss('UNKNOWN', '2100')).toBe('#ff7a2f');
    expect(getTransmissionColorCss('UNKNOWN', 'unknown')).toBe('#94a3b8');
  });

  test('power radius is monotonic, clamped, and has a fallback', () => {
    const fallback = calculateFootprintRadiusMeters(null);
    const low = calculateFootprintRadiusMeters(5);
    const high = calculateFootprintRadiusMeters(30);
    const extreme = calculateFootprintRadiusMeters(999);

    expect(fallback).toBe(650);
    expect(high).toBeGreaterThan(low);
    expect(extreme).toBe(calculateFootprintRadiusMeters(45));
  });
});
