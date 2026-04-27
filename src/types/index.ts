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
  category?: PendingChangeCategory;
  serverId?: string | null;
  panel?: string | null;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  sensitive?: boolean;
  encryptedValue?: EncryptedPendingValue | null;
  requiresRestart?: boolean;
  requiresVmRecreate?: boolean;
  createdAt?: string;
}

export type PendingChangeCategory = 'env' | 'ini-lua' | 'build' | 'infrastructure';

export interface EncryptedPendingValue {
  version: 1;
  algorithm: 'aes-256-gcm';
  kdf: 'scrypt';
  salt: string;
  nonce: string;
  authTag: string;
  ciphertext: string;
}

export interface PendingChangesByPanel {
  panel: string;
  changes: PendingChange[];
}

export interface PendingChangesImpactSummary {
  total: number;
  categories: PendingChangeCategory[];
  requiresRestart: boolean;
  requiresVmRecreate: boolean;
  pipeline: PendingChangeCategory[];
}

export type PendingChangesModalAction = 'apply' | 'discard' | 'back';

export type PendingChangesModalMode = 'summary' | 'passphrase' | 'result';

export interface PendingChangesModalState {
  isOpen: boolean;
  selectedAction: PendingChangesModalAction;
  mode: PendingChangesModalMode;
  passphraseInput: string;
  error?: string | null;
  resultMessage?: string | null;
}

export interface PendingChangeApplyStep {
  category: PendingChangeCategory;
  changeIds: string[];
  label: string;
  status: 'planned' | 'applied';
}

export interface PendingChangeApplyResult {
  applied: boolean;
  steps: PendingChangeApplyStep[];
  impact: PendingChangesImpactSummary;
  decryptedSecrets: number;
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

export type DashboardSubView = 'main' | 'confirm' | 'details' | 'edit';

export interface DashboardPanelUiState {
  rightCursor: number;
  rightActionCursor: number;
  subView: DashboardSubView;
  drafts: Record<string, string>;
  validationErrors: Record<string, string>;
  statusMessage?: string | null;
  confirmAction?: string | null;
}
