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
  /** Total rows matching the active filters, ignoring pagination. */
  total: number;
  /** True when `offset + limit < total`. */
  hasMore: boolean;
  /** Offset to request next, or `null` at the end of the result set. */
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
  /** Total users matching the same filters — lets the sidebar show a headline count. */
  total: number;
}
