import type { PendingChange, ServerRecord } from '../types/index.js';
import type { GcpPulumiDeployer, GcpPulumiOperationResult } from '../infrastructure/pulumi/gcp-pulumi-deployer.js';
import { GcpPulumiAutomationDeployer } from '../infrastructure/pulumi/gcp-pulumi-deployer.js';
import type { PulumiCliCheckResult, PulumiCliManager } from '../infrastructure/pulumi/pulumi-cli-manager.js';
import { ensureStableDeployPorts } from './deploy-ports.js';
import { generateRconPassword, validatePublicRconConfig } from './rcon-security.js';
import type { LocalInventoryService } from './local-inventory-service.js';

export interface ServerHealthChecker {
  check(server: ServerRecord): Promise<boolean>;
}

export class NoopServerHealthChecker implements ServerHealthChecker {
  async check(): Promise<boolean> {
    return true;
  }
}

export class ServerLifecycleService {
  constructor(
    private readonly inventory: LocalInventoryService,
    private readonly deployer: GcpPulumiDeployer = new GcpPulumiAutomationDeployer(),
    private readonly healthChecker: ServerHealthChecker = new NoopServerHealthChecker(),
    private readonly pulumiManager?: PulumiCliManager,
  ) {}

  async preflight(): Promise<PulumiCliCheckResult> {
    if (!this.pulumiManager) return { status: 'ready' };
    return this.pulumiManager.check();
  }

  async deploy(serverId: string): Promise<ServerRecord> {
    const server = this.requireServer(serverId);
    if (server.provider !== 'gcp') throw new Error('Only GCP deploy is implemented');
    if (server.status !== 'draft' && server.status !== 'error') throw new Error('Deploy is only available for draft or error servers');

    let prepared: ServerRecord | undefined;
    try {
      await this.assertPulumiReady();
      prepared = this.prepareDeploy(server);
      this.inventory.upsertServer({ ...prepared, status: 'provisioning', lastError: null, lastDeployStartedAt: new Date().toISOString() });
      const outputs = await this.deployer.up(prepared);
      const deployed = this.applyOutputs(prepared, outputs);
      const healthy = await this.healthChecker.check(deployed);
      const running: ServerRecord = { ...deployed, status: healthy ? 'running' : 'error', lastError: healthy ? null : 'RCON health check timed out', lastDeployFinishedAt: new Date().toISOString() };
      this.inventory.upsertServer(running);
      return running;
    } catch (error) {
      const failed: ServerRecord = { ...(prepared ?? server), status: 'error', lastError: error instanceof Error ? error.message : String(error), lastDeployFinishedAt: new Date().toISOString() };
      this.inventory.upsertServer(failed);
      return failed;
    }
  }

  async destroy(serverId: string, confirmed: boolean): Promise<ServerRecord> {
    if (!confirmed) throw new Error('Destroy requires explicit confirmation');
    const server = this.requireServer(serverId);
    try {
      await this.assertPulumiReady();
      const outputs = await this.deployer.destroy(server);
      const destroyed: ServerRecord = { ...server, ...this.outputsToServerFields(outputs), status: 'stopped', publicIp: undefined, staticIp: undefined, lastError: null };
      this.inventory.upsertServer(destroyed);
      return destroyed;
    } catch (error) {
      const failed: ServerRecord = { ...server, status: 'error', lastError: error instanceof Error ? error.message : String(error) };
      this.inventory.upsertServer(failed);
      return failed;
    }
  }

  async status(serverId: string): Promise<ServerRecord> {
    const server = this.requireServer(serverId);
    try {
      await this.assertPulumiReady();
      const outputs = await this.deployer.status(server);
      const updated: ServerRecord = { ...server, ...this.outputsToServerFields(outputs), lastStatusCheckedAt: new Date().toISOString(), lastError: null };
      this.inventory.upsertServer(updated);
      return updated;
    } catch (error) {
      const failed: ServerRecord = { ...server, status: 'error', lastError: error instanceof Error ? error.message : String(error) };
      this.inventory.upsertServer(failed);
      return failed;
    }
  }

  private async assertPulumiReady(): Promise<void> {
    if (!this.pulumiManager) return;
    const result = await this.pulumiManager.check();
    if (result.status !== 'ready') {
      throw new Error(`Pulumi CLI not ready (${result.status}). ${result.error ?? ''}`);
    }
  }

  async applyInfrastructureChanges(changes: PendingChange[]): Promise<void> {
    const serverIds = [...new Set(changes.map((change) => change.serverId).filter((id): id is string => Boolean(id)))];
    for (const serverId of serverIds) {
      const server = this.requireServer(serverId);
      if (server.provider === 'gcp' && (server.status === 'running' || server.status === 'stopped' || server.status === 'error')) {
        await this.destroy(serverId, true);
        await this.deploy(serverId);
      }
    }
  }

  private prepareDeploy(server: ServerRecord): ServerRecord {
    const ports = ensureStableDeployPorts(server, this.inventory.listServers());
    const prepared: ServerRecord = {
      ...server,
      ...ports,
      pulumiStackName: server.pulumiStackName ?? this.deployer.stackName(server),
      pulumiWorkspacePath: server.pulumiWorkspacePath ?? this.deployer.workspacePath(server),
      publicRconEnabled: server.publicRconEnabled ?? false,
      allowedRconCidrs: server.allowedRconCidrs ?? [],
      rconUnsafe: server.rconUnsafe ?? false,
      rconPassword: server.publicRconEnabled && !server.rconPassword ? generateRconPassword() : (server.rconPassword ?? null),
    };
    validatePublicRconConfig(prepared);
    return prepared;
  }

  private applyOutputs(server: ServerRecord, outputs: GcpPulumiOperationResult): ServerRecord {
    return { ...server, ...this.outputsToServerFields(outputs) };
  }

  private outputsToServerFields(outputs: GcpPulumiOperationResult): Partial<ServerRecord> {
    return {
      publicIp: outputs.publicIp ?? undefined,
      staticIp: outputs.staticIp ?? outputs.publicIp ?? undefined,
      gcpInstanceName: outputs.instanceName ?? null,
      gcpAddressName: outputs.addressName ?? null,
      gcpFirewallTag: outputs.firewallTag ?? null,
    };
  }

  private requireServer(serverId: string): ServerRecord {
    const server = this.inventory.getServer(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);
    return server;
  }
}
