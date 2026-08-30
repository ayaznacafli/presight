import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SORT_FIELDS,
  SORT_ORDERS,
  type DirectoryFilters,
  type SortField,
  type SortOrder,
} from '@/lib/api/types.ts';

export const DEFAULT_FILTERS: DirectoryFilters = {
  q: '',
  nationalities: [],
  hobbies: [],
  sort: 'first_name',
  order: 'asc',
};

const readList = (params: URLSearchParams, key: string): string[] => {
  const raw = params.getAll(key).flatMap((value) => value.split(','));
  return [...new Set(raw.map((value) => value.trim()).filter(Boolean))];
};

const readEnum = <T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T): T => {
  const value = params.get(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
};

export function parseFilters(params: URLSearchParams): DirectoryFilters {
  return {
    q: params.get('q')?.trim() ?? '',
    nationalities: readList(params, 'nationalities'),
    hobbies: readList(params, 'hobbies'),
    sort: readEnum<SortField>(params, 'sort', SORT_FIELDS, DEFAULT_FILTERS.sort),
    order: readEnum<SortOrder>(params, 'order', SORT_ORDERS, DEFAULT_FILTERS.order),
  };
}

/** Defaults are omitted so a pristine view has a clean, shareable URL. */
export function serializeFilters(filters: DirectoryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.nationalities.length) params.set('nationalities', filters.nationalities.join(','));
  if (filters.hobbies.length) params.set('hobbies', filters.hobbies.join(','));
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
  if (filters.order !== DEFAULT_FILTERS.order) params.set('order', filters.order);
  return params;
}

const toggle = (list: string[], value: string): string[] =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

/**
 * The URL is the single source of truth for the view state, so reload, deep
 * link and browser back/forward all restore the same screen for free.
 */
export function useDirectoryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<DirectoryFilters>, options?: { replace?: boolean }) => {
      setSearchParams(
        (previous) => serializeFilters({ ...parseFilters(previous), ...patch }),
        // Typing replaces (no history spam); discrete choices push, so the back
        // button undoes a filter the way users expect.
        { replace: options?.replace ?? false },
      );
    },
    [setSearchParams],
  );

  return useMemo(
    () => ({
      filters,
      /** Debounced text input — replaces the history entry. */
      setQuery: (q: string) => update({ q }, { replace: true }),
      toggleHobby: (value: string) => update({ hobbies: toggle(filters.hobbies, value) }),
      toggleNationality: (value: string) => update({ nationalities: toggle(filters.nationalities, value) }),
      setNationalities: (nationalities: string[]) => update({ nationalities }),
      setSort: (sort: SortField) => update({ sort }),
      setOrder: (order: SortOrder) => update({ order }),
      clearFacetFilters: () => update({ hobbies: [], nationalities: [] }),
      clearAll: () => update(DEFAULT_FILTERS),
      hasActiveFilters:
        filters.q !== '' || filters.hobbies.length > 0 || filters.nationalities.length > 0,
    }),
    [filters, update],
  );
}

export type DirectoryParams = ReturnType<typeof useDirectoryParams>;
