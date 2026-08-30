import { apiGet } from './client.ts';
import type { DirectoryFilters, Facets, UserPage } from './types.ts';

export const PAGE_SIZE = 30;
export const FACET_LIMIT = 20;

/** Only the parts of the view state the server filters on — sort never changes facets. */
export const filterParams = (filters: DirectoryFilters) => ({
  q: filters.q,
  nationalities: filters.nationalities,
  hobbies: filters.hobbies,
});

export function fetchUsers(
  filters: DirectoryFilters,
  offset: number,
  signal?: AbortSignal,
): Promise<UserPage> {
  return apiGet<UserPage>(
    '/users',
    { ...filterParams(filters), sort: filters.sort, order: filters.order, limit: PAGE_SIZE, offset },
    signal,
  );
}

export function fetchFacets(filters: DirectoryFilters, signal?: AbortSignal): Promise<Facets> {
  return apiGet<Facets>('/facets', { ...filterParams(filters), limit: FACET_LIMIT }, signal);
}

export const directoryKeys = {
  all: ['directory'] as const,
  users: (filters: DirectoryFilters) =>
    [...directoryKeys.all, 'users', filterParams(filters), filters.sort, filters.order] as const,
  facets: (filters: DirectoryFilters) => [...directoryKeys.all, 'facets', filterParams(filters)] as const,
};
