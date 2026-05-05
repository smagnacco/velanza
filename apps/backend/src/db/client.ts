import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import * as schema from './schema.js';
import { logger } from '../lib/logger.js';

function resolveDbPath(rawPath: string): string {
  return resolve(rawPath.replace(/^~/, homedir()));
}

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb(dbPath?: string): ReturnType<typeof drizzle> {
  if (_db) return _db;

  const path = resolveDbPath(dbPath ?? process.env['DB_PATH'] ?? '~/.velanza/data.db');
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    logger.info(`Created database directory: ${dir}`);
  }

  const sqlite = new Database(path);
  sqlite.run('PRAGMA journal_mode = WAL');
  sqlite.run('PRAGMA foreign_keys = ON');

  try {
    chmodSync(path, 0o600);
  } catch {
    // File may not exist yet on first run; chmod after creation
  }

  _db = drizzle(sqlite, { schema });
  logger.info(`Database connected: ${path}`);
  return _db;
}

export function resetDb(): void {
  _db = null;
}
