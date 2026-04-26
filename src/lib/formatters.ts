import type { ServerRecord } from '../types/index.js';

export function isActiveServer(server: ServerRecord): boolean {
  return server.status === 'running' || server.status === 'provisioning';
}

export function formatServerStatus(server: ServerRecord): string {
  if (server.status === 'running') return '🟢 RUNNING';
  if (server.status === 'provisioning') return '⚠️ INICIANDO';
  if (server.status === 'stopped') return '❌ DETENIDO';
  if (server.status === 'error') return '❌ ERROR';
  return '📝 DRAFT';
}

export function formatServerPlayers(server: ServerRecord): string {
  if (server.playersOnline === null || server.playersMax === null) return '-/-';
  return `${server.playersOnline}/${server.playersMax}`;
}

export function formatServerAction(server: ServerRecord): string {
  return isActiveServer(server) ? 'stop' : 'start';
}
