import type { ServerRecord } from '../types/index.js';
import type { TFunction } from 'i18next';

export function isActiveServer(server: ServerRecord): boolean {
  return server.status === 'running' || server.status === 'provisioning';
}

export function formatServerStatus(server: ServerRecord, t: TFunction): string {
  const emoji: Record<string, string> = {
    running: '🟢',
    provisioning: '⚠️',
    stopped: '❌',
    error: '❌',
    archived: '📦',
    draft: '📝',
  };
  const key = `formatters.status.${server.status}`;
  return `${emoji[server.status] ?? '📝'} ${t(key)}`;
}

export function formatServerPlayers(server: ServerRecord): string {
  if (server.playersOnline === null || server.playersMax === null) return '-/-';
  return `${server.playersOnline}/${server.playersMax}`;
}

export function formatRconExposure(server: ServerRecord, t: TFunction): string {
  if (!server.publicRconEnabled) return t('formatters.rcon.disabled');
  return server.rconUnsafe ? t('formatters.rcon.exposedUnsafe') : t('formatters.rcon.exposedRestricted');
}

export function formatServerAction(server: ServerRecord, t: TFunction): string {
  return isActiveServer(server) ? t('formatters.action.stop') : t('formatters.action.start');
}
