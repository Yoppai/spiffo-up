export type Provider = 'gcp' | 'aws' | 'azure';

export type ServerStatus = 'draft' | 'provisioning' | 'running' | 'stopped' | 'error';

export interface ServerRecord {
  id: string;
  name: string;
  provider: Provider;
  status: ServerStatus;
}

export interface PendingChange {
  id: string;
  label: string;
  scope: 'server' | 'settings' | 'global';
}

export interface AppSettings {
  locale: 'en' | 'es';
  theme: 'dark' | 'light';
}

export type NavigationTarget = 'dashboard' | 'servers' | 'settings' | 'wizard' | 'changes';

export interface NavigationState {
  current: NavigationTarget;
}
