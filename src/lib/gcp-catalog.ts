export type GcpContinent = 'americas' | 'europe' | 'asia' | 'oceania' | 'middle east' | 'africa';

export interface GcpZoneCatalogEntry {
  id: string;
  label: string;
  regionId: string;
  continent: GcpContinent;
  location: string;
  endpointUrl: string;
  fallbackLatencyMs: number;
}

export interface GcpRegionCatalogEntry {
  id: string;
  label: string;
  continent: GcpContinent;
  location: string;
  zones: GcpZoneCatalogEntry[];
}

export interface GcpRegionGroup {
  continent: GcpContinent;
  label: string;
  regions: GcpRegionCatalogEntry[];
}

export interface GcpEstimatedCost {
  source: 'local-estimate';
  hourlyUsd: number;
  monthlyUsd: number;
  hourlyLabel: string;
  monthlyLabel: string;
  estimated: true;
}

export interface GcpInstanceTypeMetadata {
  instanceType: string;
  family: string;
  label: string;
  vcpu: number;
  ramGb: number;
  jvmMemory: string;
  playerGuidance: string;
  estimatedCost: GcpEstimatedCost;
}

export interface GcpCuratedInstanceTier extends GcpInstanceTypeMetadata {
  id: string;
  tierLabel: 'Budget' | 'Balanced' | 'Performance' | 'Growth' | 'Heavy/Modded';
  playerRange: string;
  icon: string;
}

export interface GcpFilteredInstanceCategory {
  id: string;
  label: string;
  description: string;
  instances: GcpInstanceTypeMetadata[];
}

export type GcpLatencyState =
  | { status: 'measuring'; fallbackMs: number }
  | { status: 'ok'; pingMs: number }
  | { status: 'failed'; fallbackMs: number; error?: string };

export type GcpLatencyMap = Readonly<Record<string, GcpLatencyState | number | undefined>>;

export interface GcpLatencyMeasurer {
  (url: string, options?: { timeoutMs?: number }): Promise<number>;
}

const HOURS_PER_MONTH = 730;

const continentLabels: Record<GcpContinent, string> = {
  americas: 'Americas',
  europe: 'Europe',
  asia: 'Asia',
  oceania: 'Oceania',
  'middle east': 'Middle East',
  africa: 'Africa',
};

const rawRegions: ReadonlyArray<Omit<GcpRegionCatalogEntry, 'zones'> & { zones: ReadonlyArray<Omit<GcpZoneCatalogEntry, 'regionId' | 'continent' | 'location'>> }> = [
  {
    id: 'us-central1',
    label: 'us-central1',
    continent: 'americas',
    location: 'Iowa, USA',
    zones: [
      { id: 'us-central1-a', label: 'us-central1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 72 },
      { id: 'us-central1-b', label: 'us-central1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 76 },
    ],
  },
  {
    id: 'us-east1',
    label: 'us-east1',
    continent: 'americas',
    location: 'South Carolina, USA',
    zones: [
      { id: 'us-east1-b', label: 'us-east1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 48 },
      { id: 'us-east1-c', label: 'us-east1-c', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 52 },
    ],
  },
  {
    id: 'southamerica-east1',
    label: 'southamerica-east1',
    continent: 'americas',
    location: 'São Paulo, Brazil',
    zones: [
      { id: 'southamerica-east1-a', label: 'southamerica-east1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 128 },
      { id: 'southamerica-east1-b', label: 'southamerica-east1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 132 },
    ],
  },
  {
    id: 'europe-west1',
    label: 'europe-west1',
    continent: 'europe',
    location: 'Belgium, EU',
    zones: [
      { id: 'europe-west1-b', label: 'europe-west1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 98 },
      { id: 'europe-west1-c', label: 'europe-west1-c', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 102 },
    ],
  },
  {
    id: 'asia-southeast1',
    label: 'asia-southeast1',
    continent: 'asia',
    location: 'Singapore',
    zones: [
      { id: 'asia-southeast1-a', label: 'asia-southeast1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 185 },
      { id: 'asia-southeast1-b', label: 'asia-southeast1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 190 },
    ],
  },
  {
    id: 'australia-southeast1',
    label: 'australia-southeast1',
    continent: 'oceania',
    location: 'Sydney, Australia',
    zones: [
      { id: 'australia-southeast1-a', label: 'australia-southeast1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 210 },
      { id: 'australia-southeast1-b', label: 'australia-southeast1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 214 },
    ],
  },
  {
    id: 'me-west1',
    label: 'me-west1',
    continent: 'middle east',
    location: 'Tel Aviv, Israel',
    zones: [
      { id: 'me-west1-a', label: 'me-west1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 165 },
      { id: 'me-west1-b', label: 'me-west1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 170 },
    ],
  },
  {
    id: 'africa-south1',
    label: 'africa-south1',
    continent: 'africa',
    location: 'Johannesburg, South Africa',
    zones: [
      { id: 'africa-south1-a', label: 'africa-south1-a', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 230 },
      { id: 'africa-south1-b', label: 'africa-south1-b', endpointUrl: 'https://www.google.com/generate_204', fallbackLatencyMs: 236 },
    ],
  },
];

export const gcpRegionsCatalog: GcpRegionCatalogEntry[] = rawRegions.map((region) => ({
  ...region,
  zones: region.zones.map((zone) => ({ ...zone, regionId: region.id, continent: region.continent, location: region.location })),
}));

export const gcpRegionGroups: GcpRegionGroup[] = (Object.keys(continentLabels) as GcpContinent[])
  .map((continent) => ({ continent, label: continentLabels[continent], regions: gcpRegionsCatalog.filter((region) => region.continent === continent) }))
  .filter((group) => group.regions.length > 0);

const localHourlyPricesUsd: Record<string, number> = {
  'e2-standard-4': 0.134,
  'n2d-standard-4': 0.154,
  'c2-standard-4': 0.208,
  'n2d-standard-8': 0.308,
  'c2d-standard-8': 0.416,
  'e2-standard-2': 0.067,
  'e2-standard-8': 0.268,
  'n2-standard-4': 0.194,
  'n2-standard-8': 0.388,
  'c2-standard-8': 0.416,
  'c2d-standard-4': 0.208,
  'n1-standard-4': 0.19,
  'n1-standard-8': 0.38,
  'e2-medium': 0.034,
  'n2d-standard-2': 0.077,
};

export function estimateGcpInstanceCost(instanceType: string): GcpEstimatedCost {
  const hourlyUsd = localHourlyPricesUsd[instanceType] ?? localHourlyPricesUsd['n2d-standard-4']!;
  const monthlyUsd = hourlyUsd * HOURS_PER_MONTH;
  return {
    source: 'local-estimate',
    hourlyUsd,
    monthlyUsd,
    hourlyLabel: `~$${hourlyUsd.toFixed(3)}/hr`,
    monthlyLabel: `~$${Math.round(monthlyUsd)}/mo`,
    estimated: true,
  };
}

function instance(instanceType: string, family: string, label: string, vcpu: number, ramGb: number, jvmMemory: string, playerGuidance: string): GcpInstanceTypeMetadata {
  return { instanceType, family, label, vcpu, ramGb, jvmMemory, playerGuidance, estimatedCost: estimateGcpInstanceCost(instanceType) };
}

export const curatedInstanceTiers: GcpCuratedInstanceTier[] = [
  { id: 'budget', tierLabel: 'Budget', playerRange: '1-8 players', icon: '◌', ...instance('e2-standard-4', 'E2', 'E2 Standard 4', 4, 16, '8G', 'Small vanilla server') },
  { id: 'balanced', tierLabel: 'Balanced', playerRange: '9-24 players', icon: '◆', ...instance('n2d-standard-4', 'N2D', 'N2D Standard 4', 4, 16, '10G', 'Recommended MVP default') },
  { id: 'performance', tierLabel: 'Performance', playerRange: '9-32 players', icon: '▲', ...instance('c2-standard-4', 'C2', 'C2 Standard 4', 4, 16, '10G', 'CPU-focused busy public server') },
  { id: 'growth', tierLabel: 'Growth', playerRange: '25-48 players', icon: '⬢', ...instance('n2d-standard-8', 'N2D', 'N2D Standard 8', 8, 32, '16G', 'Growing population') },
  { id: 'heavy-modded', tierLabel: 'Heavy/Modded', playerRange: '49+ players', icon: '★', ...instance('c2d-standard-8', 'C2D', 'C2D Standard 8', 8, 32, '18G', 'Large modded worlds') },
];

export const filteredInstanceCategories: GcpFilteredInstanceCategory[] = [
  { id: 'e2', label: 'E2', description: 'Cost-effective general purpose.', instances: [instance('e2-standard-2', 'E2', 'E2 Standard 2', 2, 8, '4G', 'Advanced testing only'), curatedInstanceTiers[0]!, instance('e2-standard-8', 'E2', 'E2 Standard 8', 8, 32, '16G', 'Large budget server')] },
  { id: 'n2', label: 'N2', description: 'Balanced Intel general purpose.', instances: [instance('n2-standard-4', 'N2', 'N2 Standard 4', 4, 16, '10G', 'Balanced Intel alternative'), instance('n2-standard-8', 'N2', 'N2 Standard 8', 8, 32, '16G', 'Growth Intel alternative')] },
  { id: 'n2d', label: 'N2D', description: 'Balanced AMD price/performance.', instances: [instance('n2d-standard-2', 'N2D', 'N2D Standard 2', 2, 8, '4G', 'Advanced testing only'), curatedInstanceTiers[1]!, curatedInstanceTiers[3]!] },
  { id: 'c2', label: 'C2', description: 'Compute-optimized Intel.', instances: [curatedInstanceTiers[2]!, instance('c2-standard-8', 'C2', 'C2 Standard 8', 8, 32, '18G', 'High CPU population')] },
  { id: 'c2d', label: 'C2D', description: 'Compute-optimized AMD.', instances: [instance('c2d-standard-4', 'C2D', 'C2D Standard 4', 4, 16, '10G', 'Modern performance option'), curatedInstanceTiers[4]!] },
  { id: 'legacy-n1', label: 'Legacy N1', description: 'Legacy fallback only.', instances: [instance('n1-standard-4', 'N1', 'N1 Standard 4', 4, 15, '8G', 'Legacy compatibility'), instance('n1-standard-8', 'N1', 'N1 Standard 8', 8, 30, '16G', 'Legacy growth')] },
  { id: 'advanced-2-vcpu-testing', label: 'Advanced 2 vCPU Testing Only', description: 'Low-cost testing; not recommended for production multiplayer.', instances: [instance('e2-medium', 'E2', 'E2 Medium', 2, 4, '2G', 'Smoke tests only'), instance('n2d-standard-2', 'N2D', 'N2D Standard 2', 2, 8, '4G', 'Advanced testing only')] },
];

export const allGameServerInstanceTypes: GcpInstanceTypeMetadata[] = Array.from(
  new Map(filteredInstanceCategories.flatMap((category) => category.instances).map((metadata) => [metadata.instanceType, metadata])).values(),
);

export function findGcpInstanceTypeMetadata(instanceType: string): GcpInstanceTypeMetadata | undefined {
  return allGameServerInstanceTypes.find((metadata) => metadata.instanceType === instanceType);
}

export function isValidGcpGameServerInstance(instanceType: string): boolean {
  return Boolean(findGcpInstanceTypeMetadata(instanceType));
}

export function recommendInstanceForMaxPlayers(maxPlayers?: number | null): GcpCuratedInstanceTier {
  if (maxPlayers != null && maxPlayers >= 49) return curatedInstanceTiers.find((tier) => tier.instanceType === 'c2d-standard-8') ?? curatedInstanceTiers[1]!;
  if (maxPlayers != null && maxPlayers >= 25) return curatedInstanceTiers.find((tier) => tier.instanceType === 'n2d-standard-8') ?? curatedInstanceTiers[1]!;
  if (maxPlayers != null && maxPlayers >= 1 && maxPlayers <= 8) return curatedInstanceTiers.find((tier) => tier.instanceType === 'e2-standard-4') ?? curatedInstanceTiers[1]!;
  return curatedInstanceTiers.find((tier) => tier.instanceType === 'n2d-standard-4') ?? curatedInstanceTiers[1]!;
}

export function formatGcpLatency(state: GcpLatencyState | number | undefined, fallbackMs = 120): string {
  if (typeof state === 'number') return `${state}ms`;
  if (!state) return `~${fallbackMs}ms fallback`;
  if (state.status === 'measuring') return 'measuring...';
  if (state.status === 'ok') return `${state.pingMs}ms`;
  return `~${state.fallbackMs}ms fallback`;
}

export function latencySortValue(zone: GcpZoneCatalogEntry, latencies: GcpLatencyMap = {}): number {
  const state = latencies[zone.id];
  if (typeof state === 'number') return state;
  if (!state) return zone.fallbackLatencyMs;
  if (state.status === 'ok') return state.pingMs;
  return state.fallbackMs;
}

export function sortGcpZonesByLatency(zones: ReadonlyArray<GcpZoneCatalogEntry>, latencies: GcpLatencyMap = {}): GcpZoneCatalogEntry[] {
  return [...zones].sort((a, b) => latencySortValue(a, latencies) - latencySortValue(b, latencies));
}

export function getGcpZonesByContinent(latencies: GcpLatencyMap = {}): GcpRegionGroup[] {
  return gcpRegionGroups.map((group) => ({
    ...group,
    regions: group.regions.map((region) => ({ ...region, zones: sortGcpZonesByLatency(region.zones, latencies) })),
  }));
}

export async function measureHttpLatency(url: string, options: { timeoutMs?: number; fetcher?: typeof fetch; now?: () => number } = {}): Promise<GcpLatencyState> {
  const timeoutMs = options.timeoutMs ?? 1200;
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = now();

  try {
    await fetcher(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    return { status: 'ok', pingMs: Math.max(1, Math.round(now() - startedAt)) };
  } catch (error) {
    return { status: 'failed', fallbackMs: timeoutMs, error: error instanceof Error ? error.message : 'HTTP latency measurement failed' };
  } finally {
    clearTimeout(timeout);
  }
}
