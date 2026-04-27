import { describe, expect, it } from 'bun:test';
import {
  allGameServerInstanceTypes,
  curatedInstanceTiers,
  estimateGcpInstanceCost,
  filteredInstanceCategories,
  formatGcpLatency,
  getGcpZonesByContinent,
  measureHttpLatency,
  recommendInstanceForMaxPlayers,
  sortGcpZonesByLatency,
} from './gcp-catalog.js';

describe('gcp catalog', () => {
  it('groups regions by continent and sorts by latency', () => {
    const groups = getGcpZonesByContinent({
      'europe-west1-b': 15,
      'us-central1-a': 9,
    });

    expect(groups.map((group) => group.continent)).toContain('americas');
    expect(groups.map((group) => group.continent)).toContain('europe');
    expect(groups.find((group) => group.continent === 'europe')?.regions[0]?.zones[0]?.id).toBe('europe-west1-b');
    expect(sortGcpZonesByLatency(groups[0]!.regions[0]!.zones, { 'us-central1-a': 9 })[0]?.id).toBe('us-central1-a');
    expect(formatGcpLatency(undefined, 42)).toBe('~42ms fallback');
  });

  it('excludes bad families and keeps curated catalog local', () => {
    const instanceTypes = allGameServerInstanceTypes.map((metadata) => metadata.instanceType);

    expect(instanceTypes.some((type) => type.startsWith('shared-core'))).toBe(false);
    expect(instanceTypes.some((type) => type.includes('highcpu'))).toBe(false);
    expect(instanceTypes.some((type) => type.includes('gpu'))).toBe(false);
    expect(instanceTypes.some((type) => type.startsWith('f1-micro'))).toBe(false);
    expect(estimateGcpInstanceCost('n2-standard-4').source).toBe('local-estimate');
    expect(curatedInstanceTiers.length).toBeGreaterThan(0);
    expect(filteredInstanceCategories.length).toBeGreaterThan(0);
  });

  it('recommends tiers by player range', () => {
    expect(recommendInstanceForMaxPlayers(1).instanceType).toBe('e2-standard-4');
    expect(recommendInstanceForMaxPlayers(8).instanceType).toBe('e2-standard-4');
    expect(recommendInstanceForMaxPlayers(25).instanceType).toBe('n2d-standard-8');
    expect(recommendInstanceForMaxPlayers(49).instanceType).toBe('c2d-standard-8');
    expect(recommendInstanceForMaxPlayers(null).instanceType).toBe('n2d-standard-4');
  });

  it('measures latency with injectable fetcher', async () => {
    const fetcher = async () => new Response(null, { status: 204 });
    const result = await measureHttpLatency('https://example.com', { fetcher, now: () => 1000, timeoutMs: 25 });

    expect(result).toMatchObject({ status: 'ok', pingMs: 1 });
  });
});
