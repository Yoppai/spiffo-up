import { describe, expect, it, mock } from 'bun:test';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { LocalInventoryService } from './local-inventory-service.js';
import { ServerLifecycleService } from './server-lifecycle-service.js';

describe('server lifecycle service', () => {
  it('deploys GCP draft through deployer and persists outputs', async () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const inventory = new LocalInventoryService(db);
    inventory.upsertServer({ id: 'srv-1', name: 'alpha', provider: 'gcp', status: 'draft', region: 'us-central1', zone: 'us-central1-a', projectId: 'project', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable' });
    const deployer = {
      workspacePath: () => '/tmp/spiffo-up/pulumi/srv-1',
      stackName: () => 'spiffo-srv-1',
      up: mock(async () => ({ publicIp: '203.0.113.20', staticIp: '203.0.113.20', instanceName: 'spiffo-srv-1', addressName: 'spiffo-srv-1-ip', firewallTag: 'spiffo-srv-1' })),
      destroy: mock(async () => ({})),
      status: mock(async () => ({})),
    };

    const result = await new ServerLifecycleService(inventory, deployer).deploy('srv-1');

    expect(result.status).toBe('running');
    expect(result.publicIp).toBe('203.0.113.20');
    expect(result.gamePort).toBeGreaterThanOrEqual(30000);
    expect(inventory.getServer('srv-1')?.pulumiStackName).toBe('spiffo-srv-1');
  });

  it('persists error state for deploy failures with retry metadata', async () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const inventory = new LocalInventoryService(db);
    inventory.upsertServer({ id: 'srv-1', name: 'alpha', provider: 'gcp', status: 'draft', region: 'us-central1', zone: 'us-central1-a', projectId: 'project', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable' });
    const deployer = { workspacePath: () => '/tmp/ws', stackName: () => 'stack', up: mock(async () => { throw new Error('boom'); }), destroy: mock(async () => ({})), status: mock(async () => ({})) };

    const result = await new ServerLifecycleService(inventory, deployer).deploy('srv-1');

    expect(result.status).toBe('error');
    expect(result.lastError).toBe('boom');
    expect(result.pulumiWorkspacePath).toBe('/tmp/ws');
  });
});
