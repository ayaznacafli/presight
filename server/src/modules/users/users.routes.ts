import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors.ts';
import {
  DEFAULT_FACET_LIMIT,
  DEFAULT_PAGE_SIZE,
  FacetsQuerySchema,
  ListUsersQuerySchema,
  MAX_PAGE_SIZE,
  SORT_FIELDS,
  SORT_ORDERS,
} from './users.dto.ts';
import type { UsersService } from './users.service.ts';

interface Options {
  usersService: UsersService;
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Invalid query parameters', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

/**
 * OpenAPI documentation only.
 *
 * Runtime validation is Zod's job (it also coerces and de-duplicates the
 * repeated/CSV multi-value params). These schemas therefore describe the raw
 * wire format — every query param arrives as a string or array of strings —
 * and deliberately stay permissive so Fastify's AJV pass never rejects input
 * that Zod would happily normalise.
 */
const stringOrArray = (description: string) => ({
  description,
  anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
});

const filterProperties = {
  q: { type: 'string', description: 'Matches across first_name and last_name. Whitespace-separated tokens must all match.' },
  nationalities: stringOrArray('Repeatable or comma-separated. Matches users of ANY selected nationality.'),
  hobbies: stringOrArray('Repeatable or comma-separated. Matches users holding ALL selected hobbies.'),
} as const;

const listQueryDoc = {
  type: 'object',
  properties: {
    ...filterProperties,
    sort: { type: 'string', enum: [...SORT_FIELDS], default: 'first_name' },
    order: { type: 'string', enum: [...SORT_ORDERS], default: 'asc' },
    limit: { type: 'string', default: String(DEFAULT_PAGE_SIZE), description: `1..${MAX_PAGE_SIZE}` },
    offset: { type: 'string', default: '0' },
  },
} as const;

const facetsQueryDoc = {
  type: 'object',
  properties: {
    ...filterProperties,
    limit: { type: 'string', default: String(DEFAULT_FACET_LIMIT), description: 'Values per facet, 1..100' },
  },
} as const;

export const usersRoutes: FastifyPluginAsync<Options> = async (app, { usersService }) => {
  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: 'Paginated, filtered and sorted user directory',
        querystring: listQueryDoc,
      },
    },
    async (request) => usersService.listUsers(parse(ListUsersQuerySchema, request.query)),
  );

  app.get(
    '/facets',
    {
      schema: {
        tags: ['users'],
        summary: 'Top hobbies and nationalities for the current filter state',
        querystring: facetsQueryDoc,
      },
    },
    async (request) => usersService.getFacets(parse(FacetsQuerySchema, request.query)),
  );
};
