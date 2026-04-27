import { homedir } from 'node:os';
import { join } from 'node:path';
import * as automation from '@pulumi/pulumi/automation';

export type PulumiCliStatus = 'missing' | 'ready' | 'incompatible' | 'installing' | 'failed';

export interface PulumiCliCheckResult {
  status: PulumiCliStatus;
  version?: string;
  error?: string;
  managedPath?: string;
}

export interface PulumiCliManagerDeps {
  get(opts?: automation.PulumiCommandOptions): Promise<automation.PulumiCommand>;
  install(opts?: automation.PulumiCommandOptions): Promise<automation.PulumiCommand>;
}

export const DEFAULT_PULUMI_VERSION = '3.232.0';

export class PulumiCliManager {
  private readonly managedDir: string;

  constructor(
    private readonly deps: PulumiCliManagerDeps = { get: automation.PulumiCommand.get.bind(automation.PulumiCommand), install: automation.PulumiCommand.install.bind(automation.PulumiCommand) },
    appDataDir = join(homedir(), '.spiffo-up'),
  ) {
    this.managedDir = join(appDataDir, 'bin', 'pulumi', DEFAULT_PULUMI_VERSION);
  }

  async check(): Promise<PulumiCliCheckResult> {
    const managed = await this.tryGet({ root: this.managedDir });
    if (managed) {
      return { status: 'ready', version: managed.version?.raw ?? undefined, managedPath: this.managedDir };
    }

    const system = await this.tryGet({});
    if (system) {
      return { status: 'ready', version: system.version?.raw ?? undefined };
    }

    return { status: 'missing', error: 'Pulumi CLI not found in managed path or PATH.' };
  }

  async install(): Promise<PulumiCliCheckResult> {
    try {
      const command = await this.deps.install({ root: this.managedDir, version: DEFAULT_PULUMI_VERSION as unknown as import('semver').SemVer });
      return { status: 'ready', version: command.version?.raw ?? DEFAULT_PULUMI_VERSION, managedPath: this.managedDir };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: 'failed', error: redactInstallError(message) };
    }
  }

  async getCommand(): Promise<automation.PulumiCommand> {
    const managed = await this.tryGet({ root: this.managedDir });
    if (managed) return managed;
    return this.deps.get({});
  }

  private async tryGet(opts: automation.PulumiCommandOptions): Promise<automation.PulumiCommand | null> {
    try {
      return await this.deps.get(opts);
    } catch {
      return null;
    }
  }
}

export function redactInstallError(message: string): string {
  return message
    .replace(/(token|apikey|secret|password|key)[=:][^\s]+/gi, '$1=[REDACTED]')
    .replace(/https?:\/\/[^\s]+/gi, '[URL]');
}

export function platformInstallInstructions(): string {
  const platform = process.platform;
  if (platform === 'win32') return 'Windows: winget install Pulumi.Pulumi, then restart terminal';
  if (platform === 'darwin') return 'macOS: brew install pulumi';
  return 'Linux: curl -fsSL https://get.pulumi.com | sh';
}
