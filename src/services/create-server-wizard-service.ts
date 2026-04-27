import type { CreateServerWizardDraft, ServerRecord } from '../types/index.js';
import { gcpRegions } from '../screens/create-server-wizard/catalog.js';
import { isValidGcpGameServerInstance } from '../lib/gcp-catalog.js';
import type { LocalInventoryService } from './local-inventory-service.js';

export function buildDraftServerFromWizard(draft: CreateServerWizardDraft, existingServers: ReadonlyArray<ServerRecord> = []): ServerRecord {
  validateWizardDraft(draft);
  const id = uniqueServerId(slugifyServerName(draft.serverName), existingServers);

  return {
    id,
    name: draft.serverName.trim(),
    provider: 'gcp',
    status: 'draft',
    region: draft.region,
    zone: draft.zone,
    instanceType: draft.instanceType,
    playersOnline: null,
    playersMax: null,
    branch: 'stable',
    publicIp: undefined,
    archived: false,
  };
}

export function createLocalDraftServer(inventory: LocalInventoryService, draft: CreateServerWizardDraft): ServerRecord {
  validateWizardDraft(draft);
  const server = buildDraftServerFromWizard(draft, inventory.listServers());
  inventory.upsertServer(server);
  return inventory.getServer(server.id) ?? server;
}

export function validateWizardDraft(draft: CreateServerWizardDraft): void {
  const nameError = validateWizardServerName(draft.serverName);
  if (nameError) throw new Error(nameError);
  if (draft.provider !== 'gcp') throw new Error('Only GCP can create local drafts in this MVP.');

  const region = gcpRegions.find((candidate) => candidate.id === draft.region);
  if (!region) throw new Error('Selected GCP region is not in the local catalog.');
  if (!region.zones.some((zone) => zone.id === draft.zone)) throw new Error('Selected GCP zone is not in the local catalog.');
  if (!isValidGcpGameServerInstance(draft.instanceType)) throw new Error('Selected instance type is not in the local catalog.');
}

export function validateWizardServerName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Server name is required.';
  if (!/[a-z0-9]/i.test(trimmed)) return 'Server name must include letters or numbers.';
  if (!/^[a-z0-9][a-z0-9 _.-]*$/i.test(trimmed)) return 'Use letters, numbers, spaces, dots, underscores or dashes.';
  return null;
}

function slugifyServerName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'server';
}

function uniqueServerId(baseId: string, existingServers: ReadonlyArray<ServerRecord>): string {
  const existingIds = new Set(existingServers.map((server) => server.id));
  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) suffix += 1;
  return `${baseId}-${suffix}`;
}
