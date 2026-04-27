import { stringify } from 'yaml';
import type { ServerRecord } from '../types/index.js';
import { redactSecrets, validatePublicRconConfig } from './rcon-security.js';

export interface ComposeInput {
  server: ServerRecord;
  adminPassword: string;
}

export function generateProjectZomboidCompose({ server, adminPassword }: ComposeInput): string {
  assertDeployComposeReady(server, adminPassword);
  const environment: Record<string, string> = {
    SERVERNAME: server.name,
    ADMINPASSWORD: adminPassword,
    PUBLIC: 'true',
    BRANCH: server.branch,
  };

  if (server.publicRconEnabled) {
    environment.RCONPASSWORD = server.rconPassword!;
  }

  return stringify({
    services: {
      'project-zomboid': {
        image: 'danixu/project-zomboid-server-docker:latest',
        container_name: `spiffo-${server.id}`,
        restart: 'unless-stopped',
        environment,
        ports: [
          `${server.gamePort}:${server.gamePort}/udp`,
          `${server.queryPort}:${server.queryPort}/udp`,
          ...(server.publicRconEnabled ? [`${server.rconPort}:27015/tcp`] : []),
        ],
        volumes: ['./data:/server-data'],
      },
    },
  });
}

export function generateStartupScript(composeYaml: string): string {
  return `#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
install -d -m 700 /opt/spiffo-up/project-zomboid
cd /opt/spiffo-up/project-zomboid
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu %s stable\n' "$(dpkg --print-architecture)" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
umask 077
cat > docker-compose.yml <<'COMPOSE_YAML'
${composeYaml.trim()}
COMPOSE_YAML
docker compose up -d
`;
}

export function redactControlledError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSecrets(message);
}

function assertDeployComposeReady(server: ServerRecord, adminPassword: string): void {
  if (!server.gamePort || !server.queryPort || !server.rconPort) throw new Error('Deploy ports are required before compose generation');
  if (!adminPassword) throw new Error('ADMINPASSWORD is required before compose generation');
  validatePublicRconConfig(server);
}
