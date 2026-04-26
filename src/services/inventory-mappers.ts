import type { BackupRecord, EncryptedPendingValue, PendingChange, PendingChangeCategory, PersistedSettings, Provider, ServerRecord, ServerStatus } from '../types/index.js';

export interface ServerRow {
  id: string;
  name: string;
  provider: Provider;
  status: ServerStatus;
  region: string | null;
  zone: string | null;
  instance_type: string;
  static_ip: string | null;
  game_branch: ServerRecord['branch'];
  public_ip: string | null;
  players_online: number | null;
  players_max: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsRow {
  key: 'locale' | 'theme' | 'backup_path';
  value: string;
}

export interface PendingChangeRow {
  id: string;
  label: string;
  scope: PendingChange['scope'];
  category?: PendingChangeCategory | null;
  server_id: string | null;
  panel: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  is_sensitive?: number | null;
  encrypted_value?: string | null;
  requires_restart: number;
  requires_vm_recreate: number;
  created_at: string;
}

export interface BackupRow {
  id: string;
  server_id: string;
  path: string;
  size_bytes: number;
  type: BackupRecord['type'];
  status: BackupRecord['status'];
  created_at: string;
}

export const serverRowToDomain = (row: ServerRow): ServerRecord => ({
  id: row.id,
  name: row.name,
  provider: row.provider,
  status: row.status,
  region: row.region,
  zone: row.zone,
  instanceType: row.instance_type,
  staticIp: row.static_ip ?? undefined,
  playersOnline: row.players_online,
  playersMax: row.players_max,
  branch: row.game_branch,
  publicIp: row.public_ip ?? undefined,
  lastError: row.last_error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  archived: row.status === 'archived',
});

export const serverDomainToRow = (server: ServerRecord): ServerRow => ({
  id: server.id,
  name: server.name,
  provider: server.provider,
  status: server.status,
  region: server.region ?? null,
  zone: server.zone ?? null,
  instance_type: server.instanceType,
  static_ip: server.staticIp ?? null,
  game_branch: server.branch,
  public_ip: server.publicIp ?? null,
  players_online: server.playersOnline,
  players_max: server.playersMax,
  last_error: server.lastError ?? null,
  created_at: server.createdAt ?? new Date().toISOString(),
  updated_at: server.updatedAt ?? new Date().toISOString(),
});

export const settingsRowsToDomain = (rows: SettingsRow[], defaults: PersistedSettings): PersistedSettings => {
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    locale: values.locale === 'en' ? 'en' : defaults.locale,
    theme: values.theme === 'light' ? 'light' : defaults.theme,
    backupPath: values.backup_path ?? defaults.backupPath,
  };
};

export const settingsDomainToRows = (settings: PersistedSettings): SettingsRow[] => [
  { key: 'locale', value: settings.locale },
  { key: 'theme', value: settings.theme },
  { key: 'backup_path', value: settings.backupPath },
];

export const pendingChangeRowToDomain = (row: PendingChangeRow): PendingChange => ({
  id: row.id,
  label: row.label,
  scope: row.scope,
  category: normalizePendingChangeCategory(row.category),
  serverId: row.server_id,
  panel: row.panel,
  field: row.field,
  oldValue: row.is_sensitive === 1 ? '[changed]' : row.old_value,
  newValue: row.is_sensitive === 1 ? '[changed]' : row.new_value,
  sensitive: row.is_sensitive === 1,
  encryptedValue: parseEncryptedValue(row.encrypted_value),
  requiresRestart: row.requires_restart === 1,
  requiresVmRecreate: row.requires_vm_recreate === 1,
  createdAt: row.created_at,
});

export const pendingChangeDomainToRow = (change: PendingChange): PendingChangeRow => {
  assertSafePendingChangeForPersistence(change);

  return {
    id: change.id,
    label: change.label,
    scope: change.scope,
    category: change.category ?? 'env',
    server_id: change.serverId ?? null,
    panel: change.panel ?? null,
    field: change.field ?? null,
    old_value: change.sensitive ? null : (change.oldValue ?? null),
    new_value: change.sensitive ? null : (change.newValue ?? null),
    is_sensitive: change.sensitive ? 1 : 0,
    encrypted_value: change.encryptedValue ? JSON.stringify(change.encryptedValue) : null,
    requires_restart: change.requiresRestart ? 1 : 0,
    requires_vm_recreate: change.requiresVmRecreate ? 1 : 0,
    created_at: change.createdAt ?? new Date().toISOString(),
  };
};

export function assertSafePendingChangeForPersistence(change: PendingChange): void {
  if (change.sensitive && !change.encryptedValue) {
    throw new Error('Sensitive pending changes require encrypted payload before persistence');
  }
}

function normalizePendingChangeCategory(category: PendingChangeCategory | null | undefined): PendingChangeCategory {
  if (category === 'infrastructure' || category === 'build' || category === 'env' || category === 'ini-lua') {
    return category;
  }

  return 'env';
}

function parseEncryptedValue(value: string | null | undefined): EncryptedPendingValue | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as EncryptedPendingValue;
    return parsed.version === 1 && parsed.algorithm === 'aes-256-gcm' ? parsed : null;
  } catch {
    return null;
  }
}

export const backupRowToDomain = (row: BackupRow): BackupRecord => ({
  id: row.id,
  serverId: row.server_id,
  path: row.path,
  sizeBytes: row.size_bytes,
  type: row.type,
  status: row.status,
  createdAt: row.created_at,
});

export const backupDomainToRow = (backup: BackupRecord): BackupRow => ({
  id: backup.id,
  server_id: backup.serverId,
  path: backup.path,
  size_bytes: backup.sizeBytes,
  type: backup.type,
  status: backup.status,
  created_at: backup.createdAt,
});
