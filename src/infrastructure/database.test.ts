import { describe, expect, it } from 'bun:test';
import { createDatabaseConnection, getDefaultDatabasePath, installBaseSchema } from './database.js';

describe('database schema', () => {
  it('uses the expected default path and supports memory', () => {
    expect(getDefaultDatabasePath()).toContain('.spiffo-up');
    const db = createDatabaseConnection(':memory:');
    expect(db).toBeTruthy();
  });

  it('installs idempotently and preserves data', () => {
    const db = createDatabaseConnection(':memory:');
    installBaseSchema(db);
    db.query('INSERT INTO servers (id, name, provider, status, instance_type, game_branch) VALUES (?, ?, ?, ?, ?, ?)').run('srv-1', 'alpha', 'gcp', 'running', 'e2-standard-2', 'stable');
    installBaseSchema(db);
    const row = db.query('SELECT name, instance_type FROM servers WHERE id = ?').get('srv-1') as { name: string; instance_type: string };
    expect(row).toEqual({ name: 'alpha', instance_type: 'e2-standard-2' });
  });

  it('migrates legacy servers with optional infrastructure columns', () => {
    const db = createDatabaseConnection(':memory:');
    db.exec(`
      CREATE TABLE servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        status TEXT NOT NULL,
        region TEXT,
        zone TEXT,
        instance_type TEXT NOT NULL,
        static_ip TEXT,
        game_branch TEXT NOT NULL,
        public_ip TEXT,
        players_online INTEGER,
        players_max INTEGER,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.query('INSERT INTO servers (id, name, provider, status, instance_type, game_branch) VALUES (?, ?, ?, ?, ?, ?)').run('legacy', 'legacy', 'gcp', 'draft', 'e2-standard-2', 'stable');

    installBaseSchema(db);

    const row = db.query('SELECT id, pulumi_stack_name, game_port, public_rcon_enabled FROM servers WHERE id = ?').get('legacy') as { id: string; pulumi_stack_name: string | null; game_port: number | null; public_rcon_enabled: number };
    expect(row).toEqual({ id: 'legacy', pulumi_stack_name: null, game_port: null, public_rcon_enabled: 0 });
  });
});
