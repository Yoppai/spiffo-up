import type { PendingChange, PendingChangeCategory, ServerRecord } from '../types/index.js';
import { encryptPendingSecret } from './pending-change-crypto.js';
import i18next from '../i18n/config.js';

export type DashboardActionResult = { label: string; message: string };

export interface MockPlayer {
  id: string;
  username: string;
  status: 'online' | 'idle' | 'admin';
  pingMs: number;
}

export interface MockStatsSnapshot {
  cpu: string;
  memory: string;
  network: string;
  diskIo: string;
  logs: string[];
  refreshedAt: string;
}

export interface MockAdvancedFile {
  id: string;
  filename: string;
  description: string;
  mockPreview: string[];
}

export interface MockScheduledTask {
  id: string;
  name: string;
  type: 'backup' | 'restart' | 'update';
  cron: string;
  enabled: boolean;
}

export interface MockBackup {
  id: string;
  createdAt: string;
  size: string;
  type: 'manual' | 'scheduled' | 'pre-update';
  status: 'complete' | 'pending' | 'failed';
}

export interface DashboardMockAdapter {
  lifecycle(action: string, server: ServerRecord): DashboardActionResult;
  listPlayers(server: ServerRecord): MockPlayer[];
  getStatsSnapshot(server: ServerRecord, refreshCount?: number): MockStatsSnapshot;
  listAdvancedFiles(server: ServerRecord): MockAdvancedFile[];
  listScheduledTasks(server: ServerRecord): MockScheduledTask[];
  listBackups(server: ServerRecord): MockBackup[];
  stub(label: string): DashboardActionResult;
}

export const dashboardMockAdapter: DashboardMockAdapter = {
  lifecycle: (action, server) => ({ label: `Stub: ${action}`, message: `Stub: ${action} requested for ${server.name}; no remote side effects.` }),
  listPlayers: () => [
    { id: 'ana', username: 'Ana', status: 'admin', pingMs: 42 },
    { id: 'bruno', username: 'Bruno', status: 'online', pingMs: 68 },
    { id: 'carla', username: 'Carla', status: 'idle', pingMs: 91 },
  ],
  getStatsSnapshot: (_server, refreshCount = 0) => ({
    cpu: `${34 + refreshCount}% Mock`,
    memory: '5.8 / 8 GB Mock',
    network: '1.2 MB/s in · 0.8 MB/s out Mock',
    diskIo: '42 MB/s read · 12 MB/s write Mock',
    refreshedAt: `Mock refresh #${refreshCount}`,
    logs: ['[Mock] SERVER STARTED', '[Mock] 12 players connected', '[Mock] Autosave complete'],
  }),
  listAdvancedFiles: (server) => buildConfigFilenames(server.name).map((filename, index) => ({
    id: filename,
    filename,
    description: ['INI server config', 'SandboxVars Lua', 'Spawn regions Lua'][index] ?? 'Config file',
    mockPreview: [`# Mock preview for ${filename}`, 'PVP=false', 'PauseEmpty=true'],
  })),
  listScheduledTasks: () => [
    { id: 'backup-nightly', name: 'Nightly backup', type: 'backup', cron: '0 3 * * *', enabled: true },
    { id: 'restart-weekly', name: 'Weekly restart', type: 'restart', cron: '0 5 * * 1', enabled: true },
    { id: 'update-check', name: 'Update check', type: 'update', cron: '*/30 * * * *', enabled: false },
  ],
  listBackups: () => [
    { id: 'bkp-1', createdAt: '2026-04-26 03:00', size: '2.4 GB', type: 'scheduled', status: 'complete' },
    { id: 'bkp-2', createdAt: '2026-04-25 17:20', size: '2.3 GB', type: 'manual', status: 'complete' },
    { id: 'bkp-3', createdAt: '2026-04-24 02:55', size: '0 GB', type: 'pre-update', status: 'failed' },
  ],
  stub: (label) => ({ label: `Stub: ${label}`, message: `Stub: ${label} completed locally; no remote side effects.` }),
};

export function buildImageTag(branch: ServerRecord['branch']): string {
  return `pz-server:${branch === 'stable' ? 'latest' : branch}`;
}

export function formatInstanceTier(instanceType: string): string {
  if (instanceType.includes('standard-4')) return `${instanceType} · Performance`;
  if (instanceType.includes('standard-2')) return `${instanceType} · Balanced`;
  return `${instanceType} · Custom`;
}

export function estimateMonthlyCost(instanceType: string, region = 'us-central1'): string {
  const base = instanceType.includes('standard-4') ? 134 : 67;
  const multiplier = region.startsWith('southamerica') ? 1.24 : 1;
  return `$${Math.round(base * multiplier)}/mo Mock`;
}

export function buildConfigFilenames(serverName: string): string[] {
  return [`${serverName}.ini`, `${serverName}_SandboxVars.lua`, `${serverName}_spawnregions.lua`];
}

export function validateSimpleCron(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return i18next.t('status.cronFieldsError');
  return parts.every((part) => /^[\d*/,-]+$/.test(part)) ? null : i18next.t('status.cronCharsError');
}

export function createPendingChange(input: {
  server: ServerRecord;
  panel: string;
  field: string;
  label: string;
  oldValue?: string | null;
  newValue?: string | null;
  category: PendingChangeCategory;
  requiresRestart?: boolean;
  requiresVmRecreate?: boolean;
  sensitive?: boolean;
}): PendingChange {
  const id = `${input.server.id}-${input.panel}-${input.field}-${Date.now()}`;
  const encryptedValue = input.sensitive && input.newValue ? encryptPendingSecret(input.newValue, 'dashboard-stub-passphrase') : null;

  return {
    id,
    label: input.label,
    scope: 'server',
    serverId: input.server.id,
    panel: input.panel,
    field: input.field,
    oldValue: input.sensitive ? '[changed]' : input.oldValue,
    newValue: input.sensitive ? '[changed]' : input.newValue,
    category: input.category,
    requiresRestart: input.requiresRestart,
    requiresVmRecreate: input.requiresVmRecreate,
    sensitive: input.sensitive,
    encryptedValue,
    createdAt: new Date(0).toISOString(),
  };
}
