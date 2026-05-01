import type { GcpRegionOption, InstanceTierOption, ProviderOption, WizardStep } from '../../types/index.js';
import { curatedInstanceTiers, formatGcpLatency, gcpRegionsCatalog } from '../../lib/gcp-catalog.js';

export const wizardSteps: WizardStep[] = [
  { id: 'provider', label: 'wizard.steps.provider' },
  { id: 'auth-project', label: 'wizard.steps.authProject' },
  { id: 'server-name', label: 'wizard.steps.serverName' },
  { id: 'region', label: 'wizard.steps.region' },
  { id: 'instance', label: 'wizard.steps.instance' },
  { id: 'review', label: 'wizard.steps.review' },
];

export const providerOptions: ProviderOption[] = [
  { id: 'gcp', label: 'wizard.providers.gcp', enabled: true, statusLabel: 'catalog.statusLabels.mvpEnabled' },
  { id: 'aws', label: 'wizard.providers.aws', enabled: false, statusLabel: 'catalog.statusLabels.comingSoon' },
  { id: 'azure', label: 'wizard.providers.azure', enabled: false, statusLabel: 'catalog.statusLabels.comingSoon' },
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
