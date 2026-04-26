export type Provider = 'gcp' | 'aws' | 'azure';

export type ServerStatus = 'draft' | 'provisioning' | 'running' | 'stopped' | 'error';

export type PanelFocus = 'left' | 'right';

export type DashboardMode = 'global' | 'server';

export type GlobalMenuId = 'create-server' | 'active-servers' | 'archived-servers' | 'global-settings';

export type ServerMenuId =
  | 'server-management'
  | 'provider-region'
  | 'build'
  | 'players'
  | 'stats'
  | 'basic-settings'
  | 'advanced-settings'
  | 'admins'
  | 'scheduler'
  | 'backups'
  | 'back-to-servers';

export interface GlobalMenuItem {
  id: GlobalMenuId;
  icon: string;
  label: string;
  rightPanelTitle: string;
}

export interface ServerMenuItem {
  id: ServerMenuId;
  icon: string;
  label: string;
}

export interface ServerRecord {
  id: string;
  name: string;
  provider: Provider;
  status: ServerStatus;
  instanceType: string;
  playersOnline: number | null;
  playersMax: number | null;
  branch: 'stable' | 'unstable' | 'outdatedunstable';
  publicIp?: string;
  archived?: boolean;
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
  mode: DashboardMode;
  focusedPanel: PanelFocus;
  globalMenuIndex: number;
  serverMenuIndex: number;
  activeServersCursor: number;
}
