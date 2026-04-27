import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { GcpPulumiAutomationDeployer } from './gcp-pulumi-deployer.js';
import { sanitizeResourceName } from './gcp-project-zomboid-stack.js';

describe('GCP Pulumi deployer', () => {
  it('uses local workspace per server outside repository path', () => {
    const deployer = new GcpPulumiAutomationDeployer(join('/tmp', 'spiffo-up-test'));
    const server = { id: 'srv-1', name: 'alpha', provider: 'gcp' as const, status: 'draft' as const, instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable' as const };

    expect(deployer.workspacePath(server)).toBe(join('/tmp', 'spiffo-up-test', 'pulumi', 'srv-1'));
    expect(deployer.stackName(server)).toBe('spiffo-srv-1');
  });

  it('sanitizes resource names deterministically', () => {
    expect(sanitizeResourceName('Spiffo Server_01!')).toBe('spiffo-server-01');
  });
});
