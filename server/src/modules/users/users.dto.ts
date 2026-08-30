import { z } from 'zod';

export const SORT_FIELDS = ['first_name', 'last_name', 'age', 'nationality'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_FACET_LIMIT = 20;

/**
 * Accepts both `?hobbies=Chess&hobbies=Yoga` and `?hobbies=Chess,Yoga`, so a
 * hand-edited or shared URL behaves the same as one the client produced.
 */
const multiValue = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') return [];
    const raw = Array.isArray(value) ? value : [value];
    return [...new Set(raw.flatMap((entry) => String(entry).split(',')).map((s) => s.trim()).filter(Boolean))];
  }, z.array(z.string().min(1).max(120)).max(50))
  .default([]);

/** Filters shared by the list endpoint and the facet endpoint. */
export const FilterSchema = z.object({
  q: z.string().trim().max(120).default(''),
  nationalities: multiValue,
  hobbies: multiValue,
});

export const ListUsersQuerySchema = FilterSchema.extend({
  sort: z.enum(SORT_FIELDS).default('first_name'),
  order: z.enum(SORT_ORDERS).default('asc'),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
});

export const FacetsQuerySchema = FilterSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_FACET_LIMIT),
});

export type UserFilter = z.infer<typeof FilterSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type FacetsQuery = z.infer<typeof FacetsQuerySchema>;
