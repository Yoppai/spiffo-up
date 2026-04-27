import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export type DatabaseConnection = Database;

const DEFAULT_DB_PATH = join(homedir(), '.spiffo-up', 'spiffo-up.sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gcp', 'aws', 'azure')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'provisioning', 'running', 'stopped', 'error', 'archived')),
  region TEXT,
  zone TEXT,
  instance_type TEXT NOT NULL,
  static_ip TEXT,
  game_branch TEXT NOT NULL CHECK (game_branch IN ('stable', 'unstable', 'outdatedunstable')),
  public_ip TEXT,
  players_online INTEGER CHECK (players_online IS NULL OR players_online >= 0),
  players_max INTEGER CHECK (players_max IS NULL OR players_max >= 0),
  last_error TEXT,
  project_id TEXT,
  pulumi_stack_name TEXT,
  pulumi_workspace_path TEXT,
  game_port INTEGER CHECK (game_port IS NULL OR (game_port >= 30000 AND game_port <= 39999)),
  query_port INTEGER CHECK (query_port IS NULL OR (query_port >= 30000 AND query_port <= 39999)),
  rcon_port INTEGER CHECK (rcon_port IS NULL OR (rcon_port >= 40000 AND rcon_port <= 49999)),
  public_rcon_enabled INTEGER NOT NULL DEFAULT 0,
  allowed_rcon_cidrs TEXT,
  rcon_unsafe INTEGER NOT NULL DEFAULT 0,
  rcon_password TEXT,
  last_deploy_started_at TEXT,
  last_deploy_finished_at TEXT,
  last_status_checked_at TEXT,
  gcp_address_name TEXT,
  gcp_instance_name TEXT,
  gcp_firewall_tag TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_changes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  scope TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'env' CHECK (category IN ('env', 'ini-lua', 'build', 'infrastructure')),
  server_id TEXT REFERENCES servers(id) ON DELETE CASCADE,
  panel TEXT,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  is_sensitive INTEGER NOT NULL DEFAULT 0,
  encrypted_value TEXT,
  requires_restart INTEGER NOT NULL DEFAULT 0,
  requires_vm_recreate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  type TEXT NOT NULL CHECK (type IN ('manual', 'scheduled', 'pre-update')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'complete', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);
`;

export function createDatabaseConnection(path = DEFAULT_DB_PATH): DatabaseConnection {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const database = new Database(path);
  applyPragmas(database, path);
  return database;
}

export function installBaseSchema(database: DatabaseConnection): void {
  database.exec(SCHEMA);
  ensureServerInfrastructureColumns(database);
  ensurePendingChangesColumns(database);
}

export function getDefaultDatabasePath(): string {
  return DEFAULT_DB_PATH;
}

function applyPragmas(database: DatabaseConnection, path: string): void {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA temp_store = MEMORY;
    PRAGMA synchronous = NORMAL;
  `);

  if (path !== ':memory:') {
    database.exec('PRAGMA journal_mode = WAL;');
  }
}

function ensurePendingChangesColumns(database: DatabaseConnection): void {
  const columns = new Set(
    (database.query('PRAGMA table_info(pending_changes)').all() as Array<{ name: string }>).map((column) => column.name),
  );

  const migrations: Array<[string, string]> = [
    ['category', "ALTER TABLE pending_changes ADD COLUMN category TEXT NOT NULL DEFAULT 'env'"],
    ['is_sensitive', 'ALTER TABLE pending_changes ADD COLUMN is_sensitive INTEGER NOT NULL DEFAULT 0'],
    ['encrypted_value', 'ALTER TABLE pending_changes ADD COLUMN encrypted_value TEXT'],
  ];

  for (const [column, statement] of migrations) {
    if (!columns.has(column)) {
      database.exec(statement);
    }
  }
}

function ensureServerInfrastructureColumns(database: DatabaseConnection): void {
  const columns = new Set(
    (database.query('PRAGMA table_info(servers)').all() as Array<{ name: string }>).map((column) => column.name),
  );

  const migrations: Array<[string, string]> = [
    ['project_id', 'ALTER TABLE servers ADD COLUMN project_id TEXT'],
    ['pulumi_stack_name', 'ALTER TABLE servers ADD COLUMN pulumi_stack_name TEXT'],
    ['pulumi_workspace_path', 'ALTER TABLE servers ADD COLUMN pulumi_workspace_path TEXT'],
    ['game_port', 'ALTER TABLE servers ADD COLUMN game_port INTEGER'],
    ['query_port', 'ALTER TABLE servers ADD COLUMN query_port INTEGER'],
    ['rcon_port', 'ALTER TABLE servers ADD COLUMN rcon_port INTEGER'],
    ['public_rcon_enabled', 'ALTER TABLE servers ADD COLUMN public_rcon_enabled INTEGER NOT NULL DEFAULT 0'],
    ['allowed_rcon_cidrs', 'ALTER TABLE servers ADD COLUMN allowed_rcon_cidrs TEXT'],
    ['rcon_unsafe', 'ALTER TABLE servers ADD COLUMN rcon_unsafe INTEGER NOT NULL DEFAULT 0'],
    ['rcon_password', 'ALTER TABLE servers ADD COLUMN rcon_password TEXT'],
    ['last_deploy_started_at', 'ALTER TABLE servers ADD COLUMN last_deploy_started_at TEXT'],
    ['last_deploy_finished_at', 'ALTER TABLE servers ADD COLUMN last_deploy_finished_at TEXT'],
    ['last_status_checked_at', 'ALTER TABLE servers ADD COLUMN last_status_checked_at TEXT'],
    ['gcp_address_name', 'ALTER TABLE servers ADD COLUMN gcp_address_name TEXT'],
    ['gcp_instance_name', 'ALTER TABLE servers ADD COLUMN gcp_instance_name TEXT'],
    ['gcp_firewall_tag', 'ALTER TABLE servers ADD COLUMN gcp_firewall_tag TEXT'],
  ];

  for (const [column, statement] of migrations) {
    if (!columns.has(column)) {
      database.exec(statement);
    }
  }
}
