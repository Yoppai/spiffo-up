import { describe, expect, it } from 'bun:test';
import { ensureStableDeployPorts, generateDeployPorts } from './deploy-ports.js';

describe('deploy ports', () => {
  it('reuses persisted ports', () => {
    expect(ensureStableDeployPorts({ id: 'srv', name: 'srv', provider: 'gcp', status: 'draft', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable', gamePort: 30010, queryPort: 30011, rconPort: 40010 }, [])).toEqual({ gamePort: 30010, queryPort: 30011, rconPort: 40010 });
  });

  it('generates ports in expected ranges without local collisions', () => {
    const ports = generateDeployPorts('srv-new', [{ id: 'other', name: 'other', provider: 'gcp', status: 'running', instanceType: 'e2-standard-2', playersOnline: null, playersMax: null, branch: 'stable', gamePort: 30000, queryPort: 30001, rconPort: 40000 }]);

    expect(ports.gamePort).toBeGreaterThanOrEqual(30000);
    expect(ports.queryPort).toBe(ports.gamePort + 1);
    expect(ports.rconPort).toBeGreaterThanOrEqual(40000);
    expect([30000, 30001]).not.toContain(ports.gamePort);
    expect(ports.rconPort).not.toBe(40000);
  });
});
