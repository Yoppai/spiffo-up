import { Database } from 'bun:sqlite';

export type DatabaseConnection = Database;

export function createDatabaseConnection(path = ':memory:'): DatabaseConnection {
  return new Database(path);
}

export function installBaseSchema(_database: DatabaseConnection): void {
  // Placeholder only. Productive schema/migrations belong to a later change.
}
