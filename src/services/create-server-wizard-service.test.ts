import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createLocalDraftServer, validateWizardDraft } from './create-server-wizard-service.js';
import { createDatabaseConnection, installBaseSchema } from '../infrastructure/database.js';
import { LocalInventoryService } from './local-inventory-service.js';

describe('create server wizard service', () => {
  it('persists a local draft server', () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    const inventory = new LocalInventoryService(db);

    const server = createLocalDraftServer(inventory, {
      provider: 'gcp',
      projectId: '',
      serverName: 'Draft One',
      region: 'us-central1',
      zone: 'us-central1-a',
      instanceType: 'e2-standard-4',
    });

    expect(server.id).toBe('draft-one');
    expect(inventory.getServer('draft-one')?.status).toBe('draft');
    expect(inventory.getServer('draft-one')?.instanceType).toBe('e2-standard-4');
  });

  it('avoids pulumi and remote side-effect code in the wizard service', () => {
    const source = readFileSync(new URL('./create-server-wizard-service.ts', import.meta.url), 'utf8');

    expect(source).not.toContain('Pulumi');
    expect(source).not.toContain('SSH');
    expect(source).not.toContain('SFTP');
    expect(source).not.toContain('RCON');
  });

  it('rejects invalid draft data at the service boundary', () => {
    expect(() => validateWizardDraft({ provider: 'aws', projectId: '', serverName: 'Bad', region: 'us-central1', zone: 'us-central1-a', instanceType: 'e2-standard-4' })).toThrow('Only GCP');
    expect(() => validateWizardDraft({ provider: 'gcp', projectId: '', serverName: 'Bad', region: 'moon', zone: 'moon-a', instanceType: 'e2-standard-4' })).toThrow('region');
    expect(() => validateWizardDraft({ provider: 'gcp', projectId: '', serverName: 'Bad', region: 'us-central1', zone: 'moon-a', instanceType: 'e2-standard-4' })).toThrow('zone');
    expect(() => validateWizardDraft({ provider: 'gcp', projectId: '', serverName: 'Bad', region: 'us-central1', zone: 'us-central1-a', instanceType: 'nonsense' })).toThrow('instance type');
  });
});
