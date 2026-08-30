import type { Database } from './connection.ts';
import { migrate } from './migrate.ts';
import { FIRST_NAMES, HOBBIES, LAST_NAMES, NATIONALITIES } from './data/reference.ts';

/** Deterministic 32-bit PRNG (mulberry32) — same seed always yields the same directory. */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Zipf-like weights: index 0 is the most common value, decaying by `1/(i+1)^s`.
 * Without this every nationality/hobby lands at ~1/N and the "top 20" list is
 * meaningless noise; with it the facet counts have a real shape to read.
 */
function buildWeightedPicker<T>(values: readonly T[], rng: () => number, s = 0.85) {
  const weights = values.map((_, i) => 1 / Math.pow(i + 1, s));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const cumulative: number[] = [];
  let running = 0;
  for (const w of weights) {
    running += w / total;
    cumulative.push(running);
  }
  return (): T => {
    const r = rng();
    for (let i = 0; i < cumulative.length; i += 1) {
      if (r <= cumulative[i]!) return values[i]!;
    }
    return values[values.length - 1]!;
  };
}

/** 0..10 hobbies per user, weighted toward the 1-4 range. */
function pickHobbyCount(rng: () => number): number {
  const r = rng();
  if (r < 0.06) return 0;
  if (r < 0.22) return 1;
  if (r < 0.45) return 2;
  if (r < 0.64) return 3;
  if (r < 0.78) return 4;
  if (r < 0.87) return 5;
  if (r < 0.93) return 6;
  if (r < 0.965) return 7;
  if (r < 0.985) return 8;
  if (r < 0.996) return 9;
  return 10;
}

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export interface SeedOptions {
  userCount: number;
  randomSeed: number;
  /** Drop existing rows before inserting. */
  fresh?: boolean;
  onProgress?: (inserted: number, total: number) => void;
}

export interface SeedResult {
  users: number;
  hobbies: number;
  userHobbies: number;
  durationMs: number;
}

export function seed(db: Database, options: SeedOptions): SeedResult {
  const { userCount, randomSeed, fresh = false, onProgress } = options;
  const startedAt = performance.now();

  migrate(db);

  if (fresh) {
    db.exec('DELETE FROM user_hobbies; DELETE FROM users; DELETE FROM hobbies;');
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','hobbies')");
  }

  const rng = createRng(randomSeed);
  const pickNationality = buildWeightedPicker(NATIONALITIES, rng, 0.9);
  const pickHobbyIndex = buildWeightedPicker(
    HOBBIES.map((_, i) => i),
    rng,
    0.8,
  );
  const pickFirst = () => FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]!;
  const pickLast = () => LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]!;

  const insertHobby = db.prepare('INSERT OR IGNORE INTO hobbies (id, name) VALUES (?, ?)');
  const insertUser = db.prepare(
    'INSERT INTO users (id, avatar, first_name, last_name, age, nationality) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const linkHobby = db.prepare(
    'INSERT OR IGNORE INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)',
  );

  let userHobbyRows = 0;
  const CHUNK = 5_000;

  db.exec('BEGIN');
  try {
    HOBBIES.forEach((name, i) => insertHobby.run(i + 1, name));

    for (let id = 1; id <= userCount; id += 1) {
      const firstName = pickFirst();
      const lastName = pickLast();
      insertUser.run(
        id,
        avatarUrl(`${firstName}${lastName}${id}`),
        firstName,
        lastName,
        18 + Math.floor(rng() * 55), // 18..72
        pickNationality(),
      );

      const wanted = pickHobbyCount(rng);
      const chosen = new Set<number>();
      // Bounded retries: the weighted picker can repeat, and duplicates are
      // meaningless here (the join table is a set).
      for (let attempt = 0; attempt < wanted * 4 && chosen.size < wanted; attempt += 1) {
        chosen.add(pickHobbyIndex());
      }
      for (const hobbyIndex of chosen) {
        linkHobby.run(id, hobbyIndex + 1);
        userHobbyRows += 1;
      }

      if (id % CHUNK === 0) {
        db.exec('COMMIT');
        db.exec('BEGIN');
        onProgress?.(id, userCount);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  onProgress?.(userCount, userCount);
  db.exec('ANALYZE');

  return {
    users: userCount,
    hobbies: HOBBIES.length,
    userHobbies: userHobbyRows,
    durationMs: Math.round(performance.now() - startedAt),
  };
}
