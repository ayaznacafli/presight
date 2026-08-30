import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from '../../db/migrate.ts';
import { seed } from '../../db/seed.ts';
import { SORT_FIELDS, SORT_ORDERS, type SortField, type SortOrder } from './users.dto.ts';
import { UsersRepository } from './users.repository.ts';
import { UsersService } from './users.service.ts';

const BASE = { q: '', nationalities: [] as string[], hobbies: [] as string[] };
const listArgs = (o: Partial<Parameters<UsersService['listUsers']>[0]> = {}) => ({
  ...BASE, sort: 'first_name' as SortField, order: 'asc' as SortOrder, limit: 30, offset: 0, ...o,
});

let db: DatabaseSync;
let service: UsersService;
let repository: UsersRepository;

describe('users', () => {
  before(() => {
    db = new DatabaseSync(':memory:');
    migrate(db);
    seed(db, { userCount: 2_000, randomSeed: 42 });
    repository = new UsersRepository(db);
    service = new UsersService(repository);
  });

  after(() => db.close());

  describe('pagination', () => {
    it('walks the whole result set with no duplicates or gaps, for every sort', () => {
      for (const sort of SORT_FIELDS) {
        for (const order of SORT_ORDERS) {
          const seen: number[] = [];
          let offset = 0;
          let total = -1;

          for (;;) {
            const page = service.listUsers(listArgs({ sort, order, limit: 137, offset }));
            if (total === -1) total = page.meta.total;
            seen.push(...page.data.map((u) => u.id));
            if (!page.meta.hasMore) {
              assert.equal(page.meta.nextOffset, null, `${sort}/${order}: nextOffset at end`);
              break;
            }
            offset = page.meta.nextOffset!;
          }

          assert.equal(seen.length, total, `${sort}/${order}: row count`);
          assert.equal(new Set(seen).size, total, `${sort}/${order}: no duplicates`);
        }
      }
    });

    it('is stable — the same offset returns the same rows across calls', () => {
      const args = listArgs({ sort: 'age', order: 'desc', limit: 25, offset: 500 });
      assert.deepEqual(
        service.listUsers(args).data.map((u) => u.id),
        service.listUsers(args).data.map((u) => u.id),
      );
    });

    it('returns an empty page past the end without claiming more results', () => {
      const page = service.listUsers(listArgs({ offset: 999_999 }));
      assert.deepEqual(page.data, []);
      assert.equal(page.meta.hasMore, false);
      assert.equal(page.meta.nextOffset, null);
    });
  });

  describe('sorting', () => {
    it('orders by the requested field and falls back to id as tie-breaker', () => {
      for (const sort of SORT_FIELDS) {
        for (const order of SORT_ORDERS) {
          const rows = service.listUsers(listArgs({ sort, order, limit: 100 })).data;
          for (let i = 1; i < rows.length; i += 1) {
            const prev = rows[i - 1]!;
            const curr = rows[i]!;
            const a = prev[sort];
            const b = curr[sort];
            const ascending = typeof a === 'number' && typeof b === 'number' ? a <= b : String(a) <= String(b);
            const ok = order === 'asc' ? ascending : (typeof a === 'number' && typeof b === 'number' ? a >= b : String(a) >= String(b));
            assert.ok(ok, `${sort}/${order}: ${String(a)} then ${String(b)}`);
            if (a === b) assert.ok(prev.id < curr.id, `${sort}/${order}: id tie-break`);
          }
        }
      }
    });
  });

  describe('filtering', () => {
    it('matches the text filter across first_name and last_name', () => {
      const rows = service.listUsers(listArgs({ q: 'ar', limit: 100 })).data;
      assert.ok(rows.length > 0);
      for (const user of rows) {
        assert.ok(
          user.first_name.toLowerCase().includes('ar') || user.last_name.toLowerCase().includes('ar'),
          `${user.first_name} ${user.last_name}`,
        );
      }
    });

    it('requires every whitespace-separated token to match', () => {
      const one = service.listUsers(listArgs({ q: 'an' })).meta.total;
      const two = service.listUsers(listArgs({ q: 'an sm' })).meta.total;
      assert.ok(two <= one);
    });

    it('applies ALL semantics to hobbies', () => {
      const [first, second] = repository.topHobbies(BASE, 2);
      assert.ok(first && second);
      const both = service.listUsers(listArgs({ hobbies: [first.value, second.value], limit: 100 }));
      assert.ok(both.meta.total > 0, 'expected some users with both hobbies');
      assert.ok(both.meta.total < Math.min(first.count, second.count));
      for (const user of both.data) {
        assert.ok(user.hobbies.includes(first.value) && user.hobbies.includes(second.value));
      }
    });

    it('applies ANY semantics to nationalities', () => {
      const [first, second] = repository.topNationalities(BASE, 2);
      assert.ok(first && second);
      const either = service.listUsers(listArgs({ nationalities: [first.value, second.value] }));
      assert.equal(either.meta.total, first.count + second.count);
    });

    it('combines text, hobby and nationality filters', () => {
      const nationality = repository.topNationalities(BASE, 1)[0]!.value;
      const hobby = repository.topHobbies(BASE, 1)[0]!.value;
      const page = service.listUsers(listArgs({ q: 'a', nationalities: [nationality], hobbies: [hobby], limit: 100 }));
      for (const user of page.data) {
        assert.equal(user.nationality, nationality);
        assert.ok(user.hobbies.includes(hobby));
        assert.ok(`${user.first_name} ${user.last_name}`.toLowerCase().includes('a'));
      }
    });

    it('yields an empty result for an unknown hobby', () => {
      assert.equal(service.listUsers(listArgs({ hobbies: ['Not A Real Hobby'] })).meta.total, 0);
    });

    it('is case-insensitive for hobby and nationality values', () => {
      const hobby = repository.topHobbies(BASE, 1)[0]!.value;
      assert.equal(
        service.listUsers(listArgs({ hobbies: [hobby.toUpperCase()] })).meta.total,
        service.listUsers(listArgs({ hobbies: [hobby] })).meta.total,
      );
    });

    it('treats LIKE metacharacters as literals', () => {
      assert.equal(service.listUsers(listArgs({ q: '%' })).meta.total, 0);
      assert.equal(service.listUsers(listArgs({ q: '_' })).meta.total, 0);
    });
  });

  describe('facets', () => {
    it('returns at most the requested number of values, ranked by count', () => {
      const facets = service.getFacets({ ...BASE, limit: 20 });
      assert.ok(facets.hobbies.length <= 20 && facets.hobbies.length > 0);
      assert.ok(facets.nationalities.length <= 20 && facets.nationalities.length > 0);
      for (const list of [facets.hobbies, facets.nationalities]) {
        for (let i = 1; i < list.length; i += 1) assert.ok(list[i - 1]!.count >= list[i]!.count);
      }
    });

    it('reflects the active text filter rather than the global dataset', () => {
      const global = service.getFacets({ ...BASE, limit: 20 });
      const filtered = service.getFacets({ ...BASE, q: 'ar', limit: 20 });
      assert.ok(filtered.total < global.total);
      for (const facet of filtered.nationalities) {
        const globalCount = global.nationalities.find((f) => f.value === facet.value)?.count ?? Infinity;
        assert.ok(facet.count <= globalCount);
      }
    });

    it('counts match the list total for the same filter state', () => {
      const nationality = repository.topNationalities(BASE, 1)[0]!;
      const page = service.listUsers(listArgs({ nationalities: [nationality.value] }));
      assert.equal(page.meta.total, nationality.count);
    });

    it('hobby facet counts equal the number of matching users, not hobby rows', () => {
      const facets = service.getFacets({ ...BASE, q: 'an', limit: 5 });
      for (const facet of facets.hobbies) {
        const page = service.listUsers(listArgs({ q: 'an', hobbies: [facet.value] }));
        assert.equal(page.meta.total, facet.count, facet.value);
      }
    });
  });

  describe('seed data', () => {
    it('gives every user between 0 and 10 hobbies', () => {
      const rows = db
        .prepare('SELECT COUNT(*) AS n FROM (SELECT user_id FROM user_hobbies GROUP BY user_id HAVING COUNT(*) > 10)')
        .get() as { n: number };
      assert.equal(rows.n, 0);
    });

    it('is deterministic for a given seed', () => {
      const other = new DatabaseSync(':memory:');
      migrate(other);
      seed(other, { userCount: 200, randomSeed: 42 });
      const pick = (d: DatabaseSync) => d.prepare('SELECT first_name, last_name, age, nationality FROM users WHERE id = 7').get();
      assert.deepEqual(pick(other), pick(db));
      other.close();
    });
  });
});
