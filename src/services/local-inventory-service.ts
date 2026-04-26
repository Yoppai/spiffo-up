import type { DatabaseConnection } from '../infrastructure/database.js';
import type { BackupRecord, AppSettings, PendingChange, PersistedSettings, ServerRecord } from '../types/index.js';
import {
  backupDomainToRow,
  backupRowToDomain,
  pendingChangeDomainToRow,
  pendingChangeRowToDomain,
  serverDomainToRow,
  serverRowToDomain,
  settingsDomainToRows,
  settingsRowsToDomain,
} from './inventory-mappers.js';

const DEFAULT_SETTINGS: PersistedSettings = { locale: 'es', theme: 'dark', backupPath: '' };

export class LocalInventoryService {
  constructor(private readonly database: DatabaseConnection) {}

  listServers(): ServerRecord[] {
    const rows = this.database.query('SELECT * FROM servers ORDER BY name').all() as Array<Parameters<typeof serverRowToDomain>[0]>;
    return rows.map(serverRowToDomain);
  }

  listNonArchivedServers(): ServerRecord[] {
    const rows = this.database.query("SELECT * FROM servers WHERE status != 'archived' ORDER BY name").all() as Array<Parameters<typeof serverRowToDomain>[0]>;
    return rows.map(serverRowToDomain);
  }

  getServer(id: string): ServerRecord | null {
    const row = this.database.query('SELECT * FROM servers WHERE id = ?').get(id) as Parameters<typeof serverRowToDomain>[0] | null;
    return row ? serverRowToDomain(row) : null;
  }

  upsertServer(server: ServerRecord): void {
    const row = serverDomainToRow(server);
    this.database.query(`
      INSERT INTO servers (id, name, provider, status, region, zone, instance_type, static_ip, game_branch, public_ip, players_online, players_max, last_error, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        provider=excluded.provider,
        status=excluded.status,
        region=excluded.region,
        zone=excluded.zone,
        instance_type=excluded.instance_type,
        static_ip=excluded.static_ip,
        game_branch=excluded.game_branch,
        public_ip=excluded.public_ip,
        players_online=excluded.players_online,
        players_max=excluded.players_max,
        last_error=excluded.last_error,
        updated_at=CURRENT_TIMESTAMP
    `).run(row.id, row.name, row.provider, row.status, row.region, row.zone, row.instance_type, row.static_ip, row.game_branch, row.public_ip, row.players_online, row.players_max, row.last_error);
  }

  upsertServers(servers: ServerRecord[]): void {
    const upsert = this.database.transaction(() => {
      for (const server of servers) {
        this.upsertServer(server);
      }
    });

    upsert();
  }

  archiveServer(id: string): void {
    this.database.query("UPDATE servers SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  archiveServerWithBackup(id: string, backup: BackupRecord): void {
    const archive = this.database.transaction(() => {
      this.archiveServer(id);
      this.registerBackup(backup);
    });

    archive();
  }

  getSettings(): AppSettings {
    const rows = this.database.query('SELECT key, value FROM settings').all() as Parameters<typeof settingsRowsToDomain>[0];
    const settings = settingsRowsToDomain(rows, DEFAULT_SETTINGS);
    this.persistSettings(settings);
    return settings;
  }

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const merged: PersistedSettings = {
      locale: settings.locale ?? current.locale,
      theme: settings.theme ?? current.theme,
      backupPath: settings.backupPath ?? current.backupPath ?? '',
    };
    this.persistSettings(merged);
    return merged;
  }

  addPendingChange(change: PendingChange): void {
    const row = pendingChangeDomainToRow(change);
    this.database.query(`
      INSERT INTO pending_changes (id, label, scope, category, server_id, panel, field, old_value, new_value, is_sensitive, encrypted_value, requires_restart, requires_vm_recreate, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(row.id, row.label, row.scope, row.category ?? 'env', row.server_id, row.panel, row.field, row.old_value, row.new_value, row.is_sensitive ?? 0, row.encrypted_value ?? null, row.requires_restart, row.requires_vm_recreate, row.created_at);
  }

  listPendingChanges(): PendingChange[] {
    return (this.database.query('SELECT * FROM pending_changes ORDER BY created_at').all() as Array<Parameters<typeof pendingChangeRowToDomain>[0]>).map(pendingChangeRowToDomain);
  }

  clearPendingChanges(): void {
    this.database.query('DELETE FROM pending_changes').run();
  }

  registerBackup(backup: BackupRecord): void {
    const row = backupDomainToRow(backup);
    this.database.query('INSERT INTO backups (id, server_id, path, size_bytes, type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(row.id, row.server_id, row.path, row.size_bytes, row.type, row.status, row.created_at);
  }

  listBackups(serverId?: string): BackupRecord[] {
    const rows = serverId
      ? (this.database.query('SELECT * FROM backups WHERE server_id = ? ORDER BY created_at DESC').all(serverId) as Array<Parameters<typeof backupRowToDomain>[0]>)
      : (this.database.query('SELECT * FROM backups ORDER BY created_at DESC').all() as Array<Parameters<typeof backupRowToDomain>[0]>);
    return rows.map(backupRowToDomain);
  }

  private persistSettings(settings: PersistedSettings): void {
    const insert = this.database.query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    `);

    const persist = this.database.transaction(() => {
      for (const row of settingsDomainToRows(settings)) {
        insert.run(row.key, row.value);
      }
    });

    persist();
  }
}
