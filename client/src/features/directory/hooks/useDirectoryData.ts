import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { directoryKeys, fetchFacets, fetchUsers } from '@/lib/api/directory.api.ts';
import type { DirectoryFilters, User } from '@/lib/api/types.ts';
import { useMemo } from 'react';

/**
 * The paginated list. `keepPreviousData` keeps the previous result on screen
 * while a new filter loads, so the layout never collapses mid-typing — the
 * refetch is surfaced with a progress bar instead.
 */
export function useUsersQuery(filters: DirectoryFilters) {
  const query = useInfiniteQuery({
    queryKey: directoryKeys.users(filters),
    queryFn: ({ pageParam, signal }) => fetchUsers(filters, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.meta.nextOffset,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const users = useMemo<User[]>(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  return {
    ...query,
    users,
    total: query.data?.pages[0]?.meta.total ?? 0,
    /** True only on a cold load, when there is nothing to show yet. */
    isInitialLoading: query.isPending,
  };
}

/** Facets always use the same filter state as the list, minus sort. */
export function useFacetsQuery(filters: DirectoryFilters) {
  return useQuery({
    queryKey: directoryKeys.facets(filters),
    queryFn: ({ signal }) => fetchFacets(filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
