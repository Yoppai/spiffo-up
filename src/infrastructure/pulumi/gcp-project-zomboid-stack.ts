import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import type { ServerRecord } from '../../types/index.js';

export interface GcpProjectZomboidProgramInput {
  server: ServerRecord;
  startupScript: string;
}

export interface GcpProjectZomboidOutputs {
  publicIp: pulumi.Output<string>;
  instanceName: pulumi.Output<string>;
  addressName: pulumi.Output<string>;
  firewallTag: string;
}

export function createGcpProjectZomboidProgram({ server, startupScript }: GcpProjectZomboidProgramInput): () => GcpProjectZomboidOutputs {
  return () => {
    const region = requireRegion(server);
    const zone = requireZone(server);
    const resourceBase = sanitizeResourceName(`spiffo-${server.id}`);
    const firewallTag = server.gcpFirewallTag ?? resourceBase;
    const address = new gcp.compute.Address(`${resourceBase}-ip`, { region });
    const gameFirewall = new gcp.compute.Firewall(`${resourceBase}-game`, {
      network: 'default',
      targetTags: [firewallTag],
      allows: [{ protocol: 'udp', ports: [String(server.gamePort), String(server.queryPort)] }],
      sourceRanges: ['0.0.0.0/0'],
    });
    const rconFirewall = server.publicRconEnabled
      ? new gcp.compute.Firewall(`${resourceBase}-rcon`, {
          network: 'default',
          targetTags: [firewallTag],
          allows: [{ protocol: 'tcp', ports: [String(server.rconPort)] }],
          sourceRanges: server.allowedRconCidrs ?? [],
        })
      : null;
    const instance = new gcp.compute.Instance(`${resourceBase}-vm`, {
      zone,
      machineType: server.instanceType,
      tags: [firewallTag],
      bootDisk: { initializeParams: { image: 'ubuntu-os-cloud/ubuntu-2204-lts' } },
      networkInterfaces: [{ network: 'default', accessConfigs: [{ natIp: address.address }] }],
      metadataStartupScript: startupScript,
    }, { dependsOn: [gameFirewall, ...(rconFirewall ? [rconFirewall] : [])] });

    return { publicIp: address.address, instanceName: instance.name, addressName: address.name, firewallTag };
  };
}

export function sanitizeResourceName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'spiffo-server';
}

function requireRegion(server: ServerRecord): string {
  if (!server.region) throw new Error('GCP region is required for deploy');
  return server.region;
}

function requireZone(server: ServerRecord): string {
  if (!server.zone) throw new Error('GCP zone is required for deploy');
  return server.zone;
}
