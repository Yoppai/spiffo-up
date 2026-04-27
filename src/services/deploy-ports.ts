import type { ServerDeployPorts, ServerRecord } from '../types/index.js';

export const GAME_PORT_MIN = 30000;
export const GAME_PORT_MAX = 39999;
export const RCON_PORT_MIN = 40000;
export const RCON_PORT_MAX = 49999;

export function ensureStableDeployPorts(server: ServerRecord, existingServers: ServerRecord[]): ServerDeployPorts {
  if (hasCompleteDeployPorts(server)) {
    return { gamePort: server.gamePort, queryPort: server.queryPort, rconPort: server.rconPort };
  }

  return generateDeployPorts(server.id, existingServers.filter((candidate) => candidate.id !== server.id));
}

export function hasCompleteDeployPorts(server: ServerRecord): server is ServerRecord & Required<Pick<ServerRecord, 'gamePort' | 'queryPort' | 'rconPort'>> {
  return isGamePort(server.gamePort) && isGamePort(server.queryPort) && server.queryPort === server.gamePort + 1 && isRconPort(server.rconPort);
}

export function generateDeployPorts(seed: string, existingServers: ServerRecord[]): ServerDeployPorts {
  const usedGamePorts = new Set(existingServers.flatMap((server) => [server.gamePort, server.queryPort]).filter((port): port is number => typeof port === 'number'));
  const usedRconPorts = new Set(existingServers.map((server) => server.rconPort).filter((port): port is number => typeof port === 'number'));
  const gamePort = findAvailableGamePort(hashSeed(seed), usedGamePorts);
  const rconPort = findAvailablePort(RCON_PORT_MIN + (hashSeed(`${seed}:rcon`) % (RCON_PORT_MAX - RCON_PORT_MIN + 1)), RCON_PORT_MIN, RCON_PORT_MAX, usedRconPorts);
  return { gamePort, queryPort: gamePort + 1, rconPort };
}

function findAvailableGamePort(start: number, used: Set<number>): number {
  const candidate = GAME_PORT_MIN + ((start % ((GAME_PORT_MAX - GAME_PORT_MIN) / 2)) * 2);
  for (let port = candidate; port <= GAME_PORT_MAX - 1; port += 2) {
    if (!used.has(port) && !used.has(port + 1)) return port;
  }
  for (let port = GAME_PORT_MIN; port < candidate; port += 2) {
    if (!used.has(port) && !used.has(port + 1)) return port;
  }
  throw new Error('No available Project Zomboid game ports in 30000-39999');
}

function findAvailablePort(start: number, min: number, max: number, used: Set<number>): number {
  for (let port = start; port <= max; port += 1) {
    if (!used.has(port)) return port;
  }
  for (let port = min; port < start; port += 1) {
    if (!used.has(port)) return port;
  }
  throw new Error(`No available port in ${min}-${max}`);
}

function isGamePort(port: number | null | undefined): port is number {
  return typeof port === 'number' && Number.isInteger(port) && port >= GAME_PORT_MIN && port <= GAME_PORT_MAX;
}

function isRconPort(port: number | null | undefined): port is number {
  return typeof port === 'number' && Number.isInteger(port) && port >= RCON_PORT_MIN && port <= RCON_PORT_MAX;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
