import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { closeDatabase, getDatabase, type Database } from '../db/connection.ts';
import { isSeeded, migrate } from '../db/migrate.ts';
import { seed } from '../db/seed.ts';
import { env } from '../config/env.ts';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
  }
}

/** Owns the database lifetime: open on boot, migrate/seed if asked, close on shutdown. */
export const databasePlugin = fp(async (app: FastifyInstance) => {
  const db = getDatabase();

  if (env.AUTO_MIGRATE) {
    migrate(db);
    if (!isSeeded(db)) {
      app.log.info({ count: env.SEED_USER_COUNT }, 'empty database — seeding');
      const result = seed(db, { userCount: env.SEED_USER_COUNT, randomSeed: env.SEED_RANDOM_SEED });
      app.log.info(result, 'seed complete');
    }
  }

  app.decorate('db', db);
  app.addHook('onClose', async () => closeDatabase());
});
