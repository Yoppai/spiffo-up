import { describe, expect, it } from 'bun:test';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { backupDomainToRow, pendingChangeDomainToRow, serverDomainToRow } from './inventory-mappers.js';
import { LocalInventoryService } from './local-inventory-service.js';

describe('local inventory service', () => {
  it('persists servers, settings, pending changes, and backups in memory', () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const service = new LocalInventoryService(db);

    service.upsertServer({
      id: 'srv-1',
      name: 'alpha',
      provider: 'gcp',
      status: 'running',
      instanceType: 'e2-standard-2',
      staticIp: '1.2.3.4',
      playersOnline: 1,
      playersMax: 8,
      branch: 'unstable',
      publicIp: '1.2.3.4',
      archived: false,
    });

    expect(service.listServers()).toHaveLength(1);
    expect(service.listServers()[0].instanceType).toBe('e2-standard-2');
    expect(service.listServers()[0].staticIp).toBe('1.2.3.4');
    expect(service.listServers()[0].branch).toBe('unstable');

    expect(service.getSettings()).toEqual({ locale: 'es', theme: 'dark', backupPath: '' });
    expect(service.updateSettings({ locale: 'en', backupPath: '/tmp/backups' })).toEqual({ locale: 'en', theme: 'dark', backupPath: '/tmp/backups' });
    expect(db.query('SELECT value FROM settings WHERE key = ?').get('backup_path')).toEqual({ value: '/tmp/backups' });

    service.addPendingChange({
      id: 'chg-1',
      label: 'restart',
      scope: 'server',
      serverId: 'srv-1',
      panel: 'basic-settings',
      field: 'MaxPlayers',
      oldValue: '8',
      newValue: '16',
      requiresRestart: true,
      requiresVmRecreate: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(service.listPendingChanges()).toEqual([
      {
        id: 'chg-1',
        label: 'restart',
        scope: 'server',
        serverId: 'srv-1',
        panel: 'basic-settings',
        field: 'MaxPlayers',
        oldValue: '8',
        newValue: '16',
        requiresRestart: true,
        requiresVmRecreate: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    service.clearPendingChanges();
    expect(service.listPendingChanges()).toEqual([]);

    service.registerBackup({
      id: 'bkp-1',
      serverId: 'srv-1',
      path: '/tmp/backup.zip',
      sizeBytes: 1024,
      type: 'scheduled',
      status: 'complete',
      createdAt: '2026-01-02T00:00:00.000Z',
    });
    expect(service.listBackups('srv-1')).toEqual([
      {
        id: 'bkp-1',
        serverId: 'srv-1',
        path: '/tmp/backup.zip',
        sizeBytes: 1024,
        type: 'scheduled',
        status: 'complete',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]);

    service.archiveServer('srv-1');
    expect(service.getServer('srv-1')?.status).toBe('archived');
    expect(service.listNonArchivedServers()).toEqual([]);
  });
});

describe('inventory mappers', () => {
  it('maps SQL names to domain names', () => {
    expect(serverDomainToRow({
      id: 'srv-2',
      name: 'beta',
      provider: 'gcp',
      status: 'stopped',
      instanceType: 'n2-standard-4',
      playersOnline: null,
      playersMax: null,
      branch: 'stable',
      publicIp: undefined,
    })).toMatchObject({ instance_type: 'n2-standard-4', static_ip: null, game_branch: 'stable' });

    expect(backupDomainToRow({
      id: 'bkp-2',
      serverId: 'srv-2',
      path: '/a',
      sizeBytes: 1,
      type: 'manual',
      status: 'complete',
      createdAt: '2026-01-03T00:00:00.000Z',
    })).toMatchObject({ server_id: 'srv-2', size_bytes: 1 });
    expect(pendingChangeDomainToRow({ id: 'chg-2', label: 'save', scope: 'global' })).toMatchObject({ server_id: null, requires_restart: 0 });
  });
});
