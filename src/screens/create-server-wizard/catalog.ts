import type { GcpRegionOption, InstanceTierOption, ProviderOption, WizardStep } from '../../types/index.js';

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

export const gcpRegions: GcpRegionOption[] = [
  {
    id: 'us-central1',
    label: 'us-central1',
    location: 'Iowa, USA',
    zones: [
      { id: 'us-central1-a', label: 'us-central1-a', latencyLabel: '~ medium latency' },
      { id: 'us-central1-b', label: 'us-central1-b', latencyLabel: '~ medium latency' },
    ],
  },
  {
    id: 'us-east1',
    label: 'us-east1',
    location: 'South Carolina, USA',
    zones: [
      { id: 'us-east1-b', label: 'us-east1-b', latencyLabel: '~ low East latency' },
      { id: 'us-east1-c', label: 'us-east1-c', latencyLabel: '~ low East latency' },
    ],
  },
  {
    id: 'europe-west1',
    label: 'europe-west1',
    location: 'Belgium, EU',
    zones: [
      { id: 'europe-west1-b', label: 'europe-west1-b', latencyLabel: '~ low EU latency' },
      { id: 'europe-west1-c', label: 'europe-west1-c', latencyLabel: '~ low EU latency' },
    ],
  },
  {
    id: 'southamerica-east1',
    label: 'southamerica-east1',
    location: 'São Paulo, Brazil',
    zones: [
      { id: 'southamerica-east1-a', label: 'southamerica-east1-a', latencyLabel: '~ low LATAM latency' },
      { id: 'southamerica-east1-b', label: 'southamerica-east1-b', latencyLabel: '~ low LATAM latency' },
    ],
  },
];

export const instanceTiers: InstanceTierOption[] = [
  { id: 'budget', label: 'Budget', instanceType: 'e2-standard-2', vcpu: 2, ramGb: 8, jvmMemory: '4G', estimatedMonthlyCost: '~$49/mo', playerGuidance: 'Small vanilla server' },
  { id: 'balanced', label: 'Balanced', instanceType: 'e2-standard-4', vcpu: 4, ramGb: 16, jvmMemory: '8G', estimatedMonthlyCost: '~$97/mo', playerGuidance: 'Recommended MVP default' },
  { id: 'performance', label: 'Performance', instanceType: 'n2-standard-4', vcpu: 4, ramGb: 16, jvmMemory: '10G', estimatedMonthlyCost: '~$140/mo', playerGuidance: 'Busy public server' },
  { id: 'growth', label: 'Growth', instanceType: 'n2-standard-8', vcpu: 8, ramGb: 32, jvmMemory: '16G', estimatedMonthlyCost: '~$280/mo', playerGuidance: 'Growing population' },
  { id: 'heavy-modded', label: 'Heavy/Modded', instanceType: 'n2-highmem-8', vcpu: 8, ramGb: 64, jvmMemory: '32G', estimatedMonthlyCost: '~$360/mo', playerGuidance: 'Large modded worlds' },
];
