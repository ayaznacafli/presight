import type { FacetsQuery, ListUsersQuery, UserFilter } from './users.dto.ts';
import type { UsersRepository } from './users.repository.ts';
import type { Facets, UserPage } from './users.types.ts';

const pickFilter = (query: UserFilter): UserFilter => ({
  q: query.q,
  nationalities: query.nationalities,
  hobbies: query.hobbies,
});

export class UsersService {
  readonly #repository: UsersRepository;

  constructor(repository: UsersRepository) {
    this.#repository = repository;
  }

  listUsers(query: ListUsersQuery): UserPage {
    const filter = pickFilter(query);
    const { limit, offset, sort, order } = query;

    const total = this.#repository.countUsers(filter);
    // Skip the page query entirely when the client has scrolled past the end.
    const data = offset >= total ? [] : this.#repository.findUsers(filter, { sort, order, limit, offset });

    const consumed = offset + data.length;
    const hasMore = consumed < total;

    return {
      data,
      meta: {
        limit,
        offset,
        total,
        hasMore,
        nextOffset: hasMore ? consumed : null,
        page: Math.floor(offset / limit) + 1,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  getFacets(query: FacetsQuery): Facets {
    const filter = pickFilter(query);
    return {
      hobbies: this.#repository.topHobbies(filter, query.limit),
      nationalities: this.#repository.topNationalities(filter, query.limit),
      total: this.#repository.countUsers(filter),
    };
  }
}
