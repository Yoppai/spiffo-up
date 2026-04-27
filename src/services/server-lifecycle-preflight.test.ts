import { describe, expect, it, mock } from 'bun:test';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { LocalInventoryService } from './local-inventory-service.js';
import { ServerLifecycleService } from './server-lifecycle-service.js';
import type { PulumiCliManager } from '../infrastructure/pulumi/pulumi-cli-manager.js';

describe('server lifecycle preflight', () => {
  it('blocks deploy when pulumi manager reports missing', async () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const inventory = new LocalInventoryService(db);
    inventory.upsertServer({ id: 'srv-1', name: 'alpha', provider: 'gcp', status: 'draft', region: 'us-central1', zone: 'us-central1-a', projectId: 'p', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable' });
    const manager = { check: mock(async () => ({ status: 'missing' as const })), install: mock(async () => ({ status: 'failed' as const })), getCommand: mock(async () => ({} as never)) } as unknown as PulumiCliManager;
    const service = new ServerLifecycleService(inventory, undefined, undefined, manager);

    const result = await service.deploy('srv-1');
    expect(result.status).toBe('error');
    expect(result.lastError).toContain('Pulumi CLI not ready');
  });

  it('allows deploy when pulumi manager reports ready', async () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const inventory = new LocalInventoryService(db);
    inventory.upsertServer({ id: 'srv-1', name: 'alpha', provider: 'gcp', status: 'draft', region: 'us-central1', zone: 'us-central1-a', projectId: 'p', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable' });
    const manager = { check: mock(async () => ({ status: 'ready' as const })), install: mock(async () => ({ status: 'ready' as const })), getCommand: mock(async () => ({} as never)) } as unknown as PulumiCliManager;
    const deployer = { workspacePath: () => '/tmp', stackName: () => 'stack', up: mock(async () => ({ publicIp: '203.0.113.1' })), destroy: mock(async () => ({})), status: mock(async () => ({})) };
    const service = new ServerLifecycleService(inventory, deployer, undefined, manager);

    const result = await service.deploy('srv-1');
    expect(result.status).toBe('running');
    expect(result.publicIp).toBe('203.0.113.1');
  });
});
