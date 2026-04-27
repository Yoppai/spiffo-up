import { describe, expect, it } from 'bun:test';
import { generateProjectZomboidCompose, generateStartupScript, redactControlledError } from './project-zomboid-compose.js';

describe('Project Zomboid compose generation', () => {
  const server = {
    id: 'srv-1',
    name: 'alpha',
    provider: 'gcp' as const,
    status: 'draft' as const,
    instanceType: 'e2-standard-2',
    playersOnline: null,
    playersMax: null,
    branch: 'stable' as const,
    gamePort: 30000,
    queryPort: 30001,
    rconPort: 40000,
    publicRconEnabled: true,
    allowedRconCidrs: ['203.0.113.10/32'],
    rconPassword: 'StrongPasswordValue-123456',
  };

  it('maps persisted ports and RCON external port to 27015/tcp', () => {
    const compose = generateProjectZomboidCompose({ server, adminPassword: 'AdminPassword-1234567890' });
    expect(compose).toContain('30000:30000/udp');
    expect(compose).toContain('30001:30001/udp');
    expect(compose).toContain('40000:27015/tcp');
    expect(compose).toContain('RCONPASSWORD');
  });

  it('writes compose with restrictive permissions and no shell tracing', () => {
    const script = generateStartupScript('services: {}');
    expect(script).toContain('umask 077');
    expect(script).toContain('docker compose up -d');
    expect(script).not.toContain('set -x');
  });

  it('redacts controlled secret errors', () => {
    expect(redactControlledError(new Error('RCONPASSWORD=abc ADMINPASSWORD=def SERVER_PASSWORD=ghi'))).toBe('RCONPASSWORD=[REDACTED] ADMINPASSWORD=[REDACTED] SERVER_PASSWORD=[REDACTED]');
  });
});
