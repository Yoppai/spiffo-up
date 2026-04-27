import { randomBytes } from 'node:crypto';

export const UNSAFE_RCON_CIDRS = new Set(['0.0.0.0/0', '::/0']);
export const DEFAULT_PUBLIC_IP_SERVICES = ['https://api.ipify.org', 'https://ifconfig.co/ip', 'https://checkip.amazonaws.com'] as const;

export interface PublicIpDetectionResult {
  cidr: string | null;
  source?: string;
}

export type PublicIpFetcher = (url: string, timeoutMs: number) => Promise<string>;

export function generateRconPassword(): string {
  return randomBytes(24).toString('base64url');
}

export function isStrongRconPassword(password: string | null | undefined): password is string {
  return typeof password === 'string' && password.length >= 24 && /[A-Za-z]/.test(password) && /\d|[_-]/.test(password);
}

export function hasUnsafeRconCidr(cidrs: string[] | null | undefined): boolean {
  return (cidrs ?? []).some((cidr) => UNSAFE_RCON_CIDRS.has(cidr.trim()));
}

export function validatePublicRconConfig(input: { publicRconEnabled?: boolean; allowedRconCidrs?: string[]; rconUnsafe?: boolean; rconPassword?: string | null }): void {
  if (!input.publicRconEnabled) return;
  if (!isStrongRconPassword(input.rconPassword)) throw new Error('Public RCON requires a strong RCONPASSWORD');
  if (!input.allowedRconCidrs?.length) throw new Error('Public RCON requires allowedRconCidrs');
  if (hasUnsafeRconCidr(input.allowedRconCidrs) && !input.rconUnsafe) throw new Error('Unsafe RCON CIDR requires explicit confirmation');
}

export function normalizeIpToHostCidr(value: string): string | null {
  const ip = value.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255)) return `${ip}/32`;
  if (/^[0-9a-f:]+$/i.test(ip) && ip.includes(':')) return `${ip}/128`;
  return null;
}

export async function detectPublicIpCidr(fetcher: PublicIpFetcher, services: readonly string[] = DEFAULT_PUBLIC_IP_SERVICES, timeoutMs = 2500): Promise<PublicIpDetectionResult> {
  for (const service of services) {
    try {
      const cidr = normalizeIpToHostCidr(await fetcher(service, timeoutMs));
      if (cidr) return { cidr, source: service };
    } catch {
      // Try next echo service. Caller handles manual fallback.
    }
  }
  return { cidr: null };
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(RCONPASSWORD\s*[:=]\s*)[^\s'\"]+/gi, '$1[REDACTED]')
    .replace(/(ADMINPASSWORD\s*[:=]\s*)[^\s'\"]+/gi, '$1[REDACTED]')
    .replace(/(SERVER_PASSWORD\s*[:=]\s*)[^\s'\"]+/gi, '$1[REDACTED]');
}
