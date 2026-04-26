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
});
