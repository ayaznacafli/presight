import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env, isProduction } from './config/env.ts';
import { databasePlugin } from './plugins/database.plugin.ts';
import { errorHandlerPlugin } from './plugins/error-handler.plugin.ts';
import { UsersRepository } from './modules/users/users.repository.ts';
import { UsersService } from './modules/users/users.service.ts';
import { usersRoutes } from './modules/users/users.routes.ts';

const API_PREFIX = '/api/v1';

function corsOrigin(): true | string[] {
  return env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
}

/**
 * Composition root. Wiring lives here — modules stay unaware of how their
 * dependencies are constructed, which is what makes them testable in isolation.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(isProduction ? {} : { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }),
    },
    trustProxy: true,
    disableRequestLogging: env.LOG_LEVEL !== 'debug' && env.LOG_LEVEL !== 'trace',
  });

  await app.register(errorHandlerPlugin);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: corsOrigin(), methods: ['GET', 'OPTIONS'] });
  await app.register(databasePlugin);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Presight People Directory API',
        description: 'Searchable, filterable, paginated directory backed by SQLite.',
        version: '1.0.0',
      },
      servers: [{ url: API_PREFIX }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', { schema: { tags: ['system'], summary: 'Liveness and readiness probe' } }, async () => {
    const row = app.db.prepare('SELECT COUNT(*) AS users FROM users').get() as { users: number };
    return { status: 'ok', users: row.users, uptime: Math.round(process.uptime()) };
  });

  // --- users module ---------------------------------------------------------
  const usersRepository = new UsersRepository(app.db);
  const usersService = new UsersService(usersRepository);
  await app.register(async (scope) => usersRoutes(scope, { usersService }), { prefix: API_PREFIX });

  return app;
}
