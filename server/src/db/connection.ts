import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { env } from '../config/env.ts';

export type Database = DatabaseSync;

let instance: Database | undefined;

export function resolveDatabasePath(path: string = env.DATABASE_PATH): string {
  if (path === ':memory:') return path;
  return isAbsolute(path) ? path : resolve(process.cwd(), path);
}

/**
 * Opens (once) the process-wide SQLite handle.
 *
 * `node:sqlite` ships with Node itself, so there is no native module to compile
 * — the Docker image stays on a plain `node:24-alpine` base with no build tools.
 */
export function getDatabase(): Database {
  if (instance) return instance;

  const path = resolveDatabasePath();
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');   // concurrent reads while writing
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA cache_size = -64000');  // 64 MB page cache

  instance = db;
  return db;
}

export function closeDatabase(): void {
  instance?.close();
  instance = undefined;
}
