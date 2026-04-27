import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import * as automation from '@pulumi/pulumi/automation';
import type { ServerRecord } from '../../types/index.js';
import { generateProjectZomboidCompose, generateStartupScript, redactControlledError } from '../../services/project-zomboid-compose.js';
import { createGcpProjectZomboidProgram, sanitizeResourceName } from './gcp-project-zomboid-stack.js';
import type { PulumiCliManager } from './pulumi-cli-manager.js';

export interface GcpPulumiOperationResult {
  publicIp?: string | null;
  staticIp?: string | null;
  instanceName?: string | null;
  addressName?: string | null;
  firewallTag?: string | null;
  currentStatus?: 'running' | 'stopped' | 'error';
}

export interface GcpPulumiDeployer {
  workspacePath(server: ServerRecord): string;
  stackName(server: ServerRecord): string;
  up(server: ServerRecord): Promise<GcpPulumiOperationResult>;
  destroy(server: ServerRecord): Promise<GcpPulumiOperationResult>;
  status(server: ServerRecord): Promise<GcpPulumiOperationResult>;
}

export class GcpPulumiAutomationDeployer implements GcpPulumiDeployer {
  constructor(
    private readonly appDataDir = join(homedir(), '.spiffo-up'),
    private readonly manager?: PulumiCliManager,
  ) {}

  workspacePath(server: ServerRecord): string {
    return server.pulumiWorkspacePath ?? join(this.appDataDir, 'pulumi', server.id);
  }

  stackName(server: ServerRecord): string {
    return server.pulumiStackName ?? sanitizeResourceName(`spiffo-${server.id}`);
  }

  async up(server: ServerRecord): Promise<GcpPulumiOperationResult> {
    const stack = await this.createOrSelectStack(server);
    try {
      await stack.setConfig('gcp:project', { value: requireProjectId(server) });
      const result = await stack.up({ onOutput: () => undefined });
      return pulumiOutputsToResult(result.outputs);
    } catch (error) {
      throw new Error(redactControlledError(error));
    }
  }

  async destroy(server: ServerRecord): Promise<GcpPulumiOperationResult> {
    const stack = await this.createOrSelectStack(server);
    try {
      await stack.destroy({ onOutput: () => undefined });
      return { publicIp: null, staticIp: null, currentStatus: 'stopped' };
    } catch (error) {
      throw new Error(redactControlledError(error));
    }
  }

  async status(server: ServerRecord): Promise<GcpPulumiOperationResult> {
    const stack = await this.createOrSelectStack(server);
    const outputs = await stack.outputs();
    return pulumiOutputsToResult(outputs);
  }

  private async createOrSelectStack(server: ServerRecord): Promise<automation.Stack> {
    const workDir = this.workspacePath(server);
    mkdirSync(workDir, { recursive: true });
    const compose = generateProjectZomboidCompose({ server, adminPassword: server.rconPassword ?? generateAdminPasswordPlaceholder(server) });
    const program = createGcpProjectZomboidProgram({ server, startupScript: generateStartupScript(compose) });
    const command = this.manager ? await this.manager.getCommand() : undefined;
    return automation.LocalWorkspace.createOrSelectStack({ stackName: this.stackName(server), workDir, program, pulumiCommand: command });
  }
}

function pulumiOutputsToResult(outputs: Record<string, automation.OutputValue>): GcpPulumiOperationResult {
  return {
    publicIp: outputs.publicIp?.value as string | undefined,
    staticIp: outputs.publicIp?.value as string | undefined,
    instanceName: outputs.instanceName?.value as string | undefined,
    addressName: outputs.addressName?.value as string | undefined,
    firewallTag: outputs.firewallTag?.value as string | undefined,
    currentStatus: 'running',
  };
}

function requireProjectId(server: ServerRecord): string {
  if (!server.projectId) throw new Error('GCP projectId is required for deploy');
  return server.projectId;
}

function generateAdminPasswordPlaceholder(server: ServerRecord): string {
  return `Admin-${server.id}-ChangeMe-1234567890`;
}
