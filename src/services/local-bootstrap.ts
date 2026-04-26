import type { DatabaseConnection } from '../infrastructure/database.js';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { usePendingChangesStore } from '../stores/pending-changes-store.js';
import { seedServers, useServersStore } from '../stores/servers-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { LocalInventoryService } from './local-inventory-service.js';

export interface LocalBootstrapResult {
  database: DatabaseConnection;
  service: LocalInventoryService;
  seededDemoData: boolean;
}

export function seedDemoServersIfEmpty(service: LocalInventoryService): boolean {
  if (service.listServers().length > 0) {
    return false;
  }

  service.upsertServers(seedServers);

  return true;
}

export function hydrateStoresFromInventory(service: LocalInventoryService): void {
  const servers = service.listServers();
  useServersStore.getState().setServers(servers);
  useSettingsStore.getState().setSettings(service.getSettings());
  usePendingChangesStore.getState().setChanges(service.listPendingChanges());
}

export function bootstrapLocalInventory(database = createDatabaseConnection()): LocalBootstrapResult {
  installBaseSchema(database);
  const service = new LocalInventoryService(database);
  const seededDemoData = seedDemoServersIfEmpty(service);
  hydrateStoresFromInventory(service);

  return { database, service, seededDemoData };
}
