import { describe, expect, it, mock } from 'bun:test';
import { PulumiCliManager, type PulumiCliManagerDeps, redactInstallError, platformInstallInstructions } from './pulumi-cli-manager.js';

function fakeDeps(overrides?: Partial<PulumiCliManagerDeps>): PulumiCliManagerDeps {
  return {
    get: mock(async () => { throw new Error('not found'); }),
    install: mock(async () => { throw new Error('install failed'); }),
    ...overrides,
  };
}

function fakeCommand(version = '3.232.0') {
  return { command: 'pulumi', version: { raw: version } as import('semver').SemVer };
}

describe('PulumiCliManager', () => {
  it('reports ready when managed CLI exists', async () => {
    const deps = fakeDeps({ get: mock(async (opts) => {
      if (opts?.root) return fakeCommand();
      throw new Error('not found');
    }) });
    const result = await new PulumiCliManager(deps).check();
    expect(result.status).toBe('ready');
    expect(result.version).toBe('3.232.0');
    expect(result.managedPath).toContain('.spiffo-up');
  });

  it('falls back to PATH when managed CLI missing', async () => {
    const deps = fakeDeps({ get: mock(async (opts) => {
      if (!opts?.root) return fakeCommand();
      throw new Error('not found');
    }) });
    const result = await new PulumiCliManager(deps).check();
    expect(result.status).toBe('ready');
    expect(result.managedPath).toBeUndefined();
  });

  it('reports missing when neither managed nor PATH exists', async () => {
    const result = await new PulumiCliManager(fakeDeps()).check();
    expect(result.status).toBe('missing');
  });

  it('installs and reports ready', async () => {
    const deps = fakeDeps({ install: mock(async () => fakeCommand()) });
    const result = await new PulumiCliManager(deps).install();
    expect(result.status).toBe('ready');
    expect(result.version).toBe('3.232.0');
  });

  it('reports failed install with redacted error', async () => {
    const deps = fakeDeps({ install: mock(async () => { throw new Error('network error at https://get.pulumi.com token=abc123'); }) });
    const result = await new PulumiCliManager(deps).install();
    expect(result.status).toBe('failed');
    expect(result.error).not.toContain('abc123');
    expect(result.error).toContain('[URL]');
  });

  it('returns managed command from getCommand', async () => {
    const deps = fakeDeps({ get: mock(async (opts) => {
      if (opts?.root) return fakeCommand('3.232.1');
      throw new Error('not found');
    }) });
    const cmd = await new PulumiCliManager(deps).getCommand();
    expect(cmd.version?.raw).toBe('3.232.1');
  });
});

describe('redactInstallError', () => {
  it('redacts tokens and urls', () => {
    expect(redactInstallError('token=secretvalue https://example.com')).toBe('token=[REDACTED] [URL]');
  });
});

describe('platformInstallInstructions', () => {
  it('returns a string', () => {
    expect(typeof platformInstallInstructions()).toBe('string');
  });
});
