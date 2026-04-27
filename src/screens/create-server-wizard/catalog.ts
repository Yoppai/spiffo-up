import type { GcpRegionOption, InstanceTierOption, ProviderOption, WizardStep } from '../../types/index.js';
import { curatedInstanceTiers, formatGcpLatency, gcpRegionsCatalog } from '../../lib/gcp-catalog.js';

export const wizardSteps: WizardStep[] = [
  { id: 'provider', label: 'Provider' },
  { id: 'auth-project', label: 'Auth/Project' },
  { id: 'server-name', label: 'Server Name' },
  { id: 'region', label: 'Region' },
  { id: 'instance', label: 'Instance' },
  { id: 'review', label: 'Review' },
];

export const providerOptions: ProviderOption[] = [
  { id: 'gcp', label: 'GCP', enabled: true, statusLabel: 'MVP enabled' },
  { id: 'aws', label: 'AWS', enabled: false, statusLabel: 'Coming Soon' },
  { id: 'azure', label: 'Azure', enabled: false, statusLabel: 'Coming Soon' },
];

export const gcpRegions: GcpRegionOption[] = gcpRegionsCatalog.map((region) => ({
  id: region.id,
  label: region.label,
  continent: region.continent,
  location: region.location,
  zones: region.zones.map((zone) => ({
    id: zone.id,
    label: zone.label,
    continent: zone.continent,
    location: zone.location,
    endpointUrl: zone.endpointUrl,
    fallbackLatencyMs: zone.fallbackLatencyMs,
    latencyLabel: formatGcpLatency(undefined, zone.fallbackLatencyMs),
  })),
}));

export const instanceTiers: InstanceTierOption[] = curatedInstanceTiers.map((tier) => ({
  id: tier.id,
  label: tier.tierLabel,
  instanceType: tier.instanceType,
  vcpu: tier.vcpu,
  ramGb: tier.ramGb,
  jvmMemory: tier.jvmMemory,
  estimatedMonthlyCost: tier.estimatedCost.monthlyLabel,
  estimatedHourlyCost: tier.estimatedCost.hourlyLabel,
  playerGuidance: `${tier.playerRange} · ${tier.playerGuidance}`,
  recommended: tier.id === 'balanced',
}));
