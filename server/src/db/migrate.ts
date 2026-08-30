import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Database } from './connection.ts';

const SCHEMA_PATH = fileURLToPath(new URL('./schema.sql', import.meta.url));

/** Idempotent: every statement in schema.sql is `IF NOT EXISTS`. */
export function migrate(db: Database): void {
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
}

export function isSeeded(db: Database): boolean {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number } | undefined;
  return (row?.n ?? 0) > 0;
}
