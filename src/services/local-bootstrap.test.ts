import { afterEach, describe, expect, it } from 'bun:test';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { usePendingChangesStore } from '../stores/pending-changes-store.js';
import { seedServers, useServersStore } from '../stores/servers-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { bootstrapLocalInventory } from './local-bootstrap.js';
import { LocalInventoryService } from './local-inventory-service.js';

describe('local inventory bootstrap', () => {
  afterEach(() => {
    useServersStore.getState().resetServers();
    useSettingsStore.getState().resetSettings();
    usePendingChangesStore.getState().clearChanges();
  });

  it('seeds demo servers into an empty database and hydrates stores', () => {
    const result = bootstrapLocalInventory(createDatabaseConnection(':memory:'));

    expect(result.seededDemoData).toBe(true);
    expect(result.service.listServers()).toHaveLength(seedServers.length);
    expect(useServersStore.getState().servers).toHaveLength(seedServers.length);
    expect(useSettingsStore.getState().settings).toEqual({ locale: 'es', theme: 'dark', backupPath: '' });
    expect(usePendingChangesStore.getState().changes).toEqual([]);
  });

  it('hydrates existing data without replacing it with demo seeds', () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const service = new LocalInventoryService(db);
    service.upsertServer({
      id: 'custom',
      name: 'Custom',
      provider: 'gcp',
      status: 'running',
      instanceType: 'n2-standard-4',
      playersOnline: null,
      playersMax: null,
      branch: 'stable',
    });
    service.updateSettings({ locale: 'en', backupPath: '/var/backups' });
    service.addPendingChange({ id: 'change-1', label: 'Change MaxPlayers', scope: 'server', serverId: 'custom' });

    const result = bootstrapLocalInventory(db);

    expect(result.seededDemoData).toBe(false);
    expect(useServersStore.getState().servers.map((server) => server.id)).toEqual(['custom']);
    expect(useSettingsStore.getState().settings).toEqual({ locale: 'en', theme: 'dark', backupPath: '/var/backups' });
    expect(usePendingChangesStore.getState().changes).toHaveLength(1);
  });
});
