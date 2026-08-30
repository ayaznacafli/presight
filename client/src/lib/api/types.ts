/** Mirrors the server's response contracts (`server/src/modules/users/users.types.ts`). */

export interface User {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
  page: number;
  pageCount: number;
}

export interface UserPage {
  data: User[];
  meta: PageMeta;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facets {
  hobbies: FacetValue[];
  nationalities: FacetValue[];
  total: number;
}

export const SORT_FIELDS = ['first_name', 'last_name', 'age', 'nationality'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

/** The full view state — mirrored one-to-one into the URL query string. */
export interface DirectoryFilters {
  q: string;
  nationalities: string[];
  hobbies: string[];
  sort: SortField;
  order: SortOrder;
}
