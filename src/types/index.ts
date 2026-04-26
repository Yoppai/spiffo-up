export type Provider = 'gcp' | 'aws' | 'azure';

export type ServerStatus = 'draft' | 'provisioning' | 'running' | 'stopped' | 'error' | 'archived';

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
  region?: string | null;
  zone?: string | null;
  instanceType: string;
  staticIp?: string;
  playersOnline: number | null;
  playersMax: number | null;
  branch: 'stable' | 'unstable' | 'outdatedunstable';
  publicIp?: string;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

export interface PendingChange {
  id: string;
  label: string;
  scope: 'server' | 'settings' | 'global';
  serverId?: string | null;
  panel?: string | null;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  requiresRestart?: boolean;
  requiresVmRecreate?: boolean;
  createdAt?: string;
}

export interface AppSettings {
  locale: 'en' | 'es';
  theme: 'dark' | 'light';
  backupPath?: string;
}

export interface BackupRecord {
  id: string;
  serverId: string;
  path: string;
  sizeBytes: number;
  type: 'manual' | 'scheduled' | 'pre-update';
  status: 'pending' | 'complete' | 'failed';
  createdAt: string;
}

export interface PersistedSettings extends AppSettings {
  backupPath: string;
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
