import { describe, expect, it } from 'bun:test';
import { detectPublicIpCidr, generateRconPassword, hasUnsafeRconCidr, isStrongRconPassword, normalizeIpToHostCidr, validatePublicRconConfig } from './rcon-security.js';

describe('rcon security', () => {
  it('generates and validates strong passwords', () => {
    const password = generateRconPassword();
    expect(isStrongRconPassword(password)).toBe(true);
    expect(() => validatePublicRconConfig({ publicRconEnabled: true, allowedRconCidrs: ['203.0.113.10/32'], rconPassword: 'short' })).toThrow('strong RCONPASSWORD');
  });

  it('requires explicit confirmation for unsafe CIDRs', () => {
    expect(hasUnsafeRconCidr(['0.0.0.0/0'])).toBe(true);
    expect(() => validatePublicRconConfig({ publicRconEnabled: true, allowedRconCidrs: ['0.0.0.0/0'], rconPassword: 'StrongPasswordValue-123456', rconUnsafe: false })).toThrow('Unsafe RCON CIDR');
    expect(() => validatePublicRconConfig({ publicRconEnabled: true, allowedRconCidrs: ['0.0.0.0/0'], rconPassword: 'StrongPasswordValue-123456', rconUnsafe: true })).not.toThrow();
  });

  it('normalizes public IP detection and falls back to manual', async () => {
    expect(normalizeIpToHostCidr('203.0.113.10')).toBe('203.0.113.10/32');
    expect(normalizeIpToHostCidr('2001:db8::1')).toBe('2001:db8::1/128');
    expect(await detectPublicIpCidr(async (url) => (url === 'bad' ? 'nope' : '203.0.113.11'), ['bad', 'good'])).toEqual({ cidr: '203.0.113.11/32', source: 'good' });
    expect(await detectPublicIpCidr(async () => 'nope', ['bad'])).toEqual({ cidr: null });
  });
});
