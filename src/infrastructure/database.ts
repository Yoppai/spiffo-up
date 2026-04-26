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
