import type { Database } from '../../db/connection.ts';
import { SORT_FIELDS, type SortField, type SortOrder, type UserFilter } from './users.dto.ts';
import type { FacetValue, User } from './users.types.ts';

type SqlValue = string | number;

interface WhereClause {
  sql: string;
  params: SqlValue[];
  /** A filter referenced a value that exists nowhere — short-circuit to an empty page. */
  impossible: boolean;
}

/** Whitelist map. Sort fields never reach SQL as raw strings. */
const SORT_COLUMN: Record<SortField, string> = {
  first_name: 'u.first_name',
  last_name: 'u.last_name',
  age: 'u.age',
  nationality: 'u.nationality',
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export class UsersRepository {
  /** Canonical-case lookups for the small reference sets, rebuilt lazily. */
  #hobbyIdByName?: Map<string, number>;
  #nationalityByName?: Map<string, string>;

  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  /** Call after a reseed so cached reference data does not go stale. */
  invalidateCaches(): void {
    this.#hobbyIdByName = undefined;
    this.#nationalityByName = undefined;
  }

  #hobbyIndex(): Map<string, number> {
    if (!this.#hobbyIdByName) {
      const rows = this.#db.prepare('SELECT id, name FROM hobbies').all() as Array<{ id: number; name: string }>;
      this.#hobbyIdByName = new Map(rows.map((row) => [row.name.toLowerCase(), row.id]));
    }
    return this.#hobbyIdByName;
  }

  #nationalityIndex(): Map<string, string> {
    if (!this.#nationalityByName) {
      const rows = this.#db
        .prepare('SELECT DISTINCT nationality AS value FROM users')
        .all() as Array<{ value: string }>;
      this.#nationalityByName = new Map(rows.map((row) => [row.value.toLowerCase(), row.value]));
    }
    return this.#nationalityByName;
  }

  /**
   * Compiles the shared predicate used by the page query, the count query and
   * both facet queries — so a filter can never drift between them.
   */
  #buildWhere(filter: UserFilter): WhereClause {
    const conditions: string[] = ['1 = 1'];
    const params: SqlValue[] = [];

    // --- text: every token must hit first_name or last_name -----------------
    // Lets "ada lov" match "Ada Lovelace" while a single token still works.
    const tokens = filter.q.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const pattern = `%${escapeLike(token)}%`;
      conditions.push("(u.first_name LIKE ? ESCAPE '\\' OR u.last_name LIKE ? ESCAPE '\\')");
      params.push(pattern, pattern);
    }

    // --- nationality: OR across the selected values --------------------------
    if (filter.nationalities.length > 0) {
      const index = this.#nationalityIndex();
      const canonical = [
        ...new Set(filter.nationalities.map((n) => index.get(n.toLowerCase())).filter((n): n is string => !!n)),
      ];
      if (canonical.length === 0) return { sql: '', params: [], impossible: true };
      conditions.push(`u.nationality IN (${canonical.map(() => '?').join(', ')})`);
      params.push(...canonical);
    }

    // --- hobbies: AND — the user must hold *every* selected hobby ------------
    if (filter.hobbies.length > 0) {
      const index = this.#hobbyIndex();
      const ids = filter.hobbies.map((name) => index.get(name.toLowerCase()));
      // An unknown hobby can never be held by anyone, so ALL-semantics fail outright.
      if (ids.some((id) => id === undefined)) return { sql: '', params: [], impossible: true };
      const unique = [...new Set(ids as number[])];
      conditions.push(
        `u.id IN (
           SELECT uh.user_id FROM user_hobbies uh
           WHERE uh.hobby_id IN (${unique.map(() => '?').join(', ')})
           GROUP BY uh.user_id
           HAVING COUNT(*) = ?
         )`,
      );
      params.push(...unique, unique.length);
    }

    return { sql: `WHERE ${conditions.join('\n  AND ')}`, params, impossible: false };
  }

  countUsers(filter: UserFilter): number {
    const where = this.#buildWhere(filter);
    if (where.impossible) return 0;
    const row = this.#db
      .prepare(`SELECT COUNT(*) AS total FROM users u ${where.sql}`)
      .get(...where.params) as { total: number } | undefined;
    return row?.total ?? 0;
  }

  findUsers(
    filter: UserFilter,
    options: { sort: SortField; order: SortOrder; limit: number; offset: number },
  ): User[] {
    const where = this.#buildWhere(filter);
    if (where.impossible) return [];

    const column = SORT_COLUMN[options.sort] ?? SORT_COLUMN[SORT_FIELDS[0]];
    const direction = options.order === 'desc' ? 'DESC' : 'ASC';

    const rows = this.#db
      .prepare(
        `SELECT u.id, u.avatar, u.first_name, u.last_name, u.age, u.nationality
           FROM users u
           ${where.sql}
          ORDER BY ${column} ${direction}, u.id ASC
          LIMIT ? OFFSET ?`,
      )
      .all(...where.params, options.limit, options.offset) as Array<Omit<User, 'hobbies'>>;

    return this.#attachHobbies(rows);
  }

  /** One extra round-trip for the page instead of N+1 per card. */
  #attachHobbies(rows: Array<Omit<User, 'hobbies'>>): User[] {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const links = this.#db
      .prepare(
        `SELECT uh.user_id AS userId, h.name AS name
           FROM user_hobbies uh
           JOIN hobbies h ON h.id = uh.hobby_id
          WHERE uh.user_id IN (${ids.map(() => '?').join(', ')})
          ORDER BY uh.user_id, h.name`,
      )
      .all(...ids) as Array<{ userId: number; name: string }>;

    const byUser = new Map<number, string[]>();
    for (const link of links) {
      const list = byUser.get(link.userId);
      if (list) list.push(link.name);
      else byUser.set(link.userId, [link.name]);
    }

    return rows.map((row) => ({
      id: row.id,
      avatar: row.avatar,
      first_name: row.first_name,
      last_name: row.last_name,
      age: row.age,
      nationality: row.nationality,
      hobbies: byUser.get(row.id) ?? [],
    }));
  }

  /**
   * Facets are computed against the *same* WHERE clause as the list, so counts
   * always describe the result set the user is currently looking at.
   */
  topNationalities(filter: UserFilter, limit: number): FacetValue[] {
    const where = this.#buildWhere(filter);
    if (where.impossible) return [];
    return this.#db
      .prepare(
        `SELECT u.nationality AS value, COUNT(*) AS count
           FROM users u
           ${where.sql}
          GROUP BY u.nationality
          ORDER BY count DESC, value ASC
          LIMIT ?`,
      )
      .all(...where.params, limit) as FacetValue[];
  }

  topHobbies(filter: UserFilter, limit: number): FacetValue[] {
    const where = this.#buildWhere(filter);
    if (where.impossible) return [];
    return this.#db
      .prepare(
        `SELECT h.name AS value, COUNT(*) AS count
           FROM users u
           JOIN user_hobbies uh ON uh.user_id = u.id
           JOIN hobbies h       ON h.id = uh.hobby_id
           ${where.sql}
          GROUP BY h.id
          ORDER BY count DESC, value ASC
          LIMIT ?`,
      )
      .all(...where.params, limit) as FacetValue[];
  }
}
