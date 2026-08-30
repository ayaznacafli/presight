import { buildApp } from './app.ts';
import { env } from './config/env.ts';

const app = await buildApp();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`${signal} received — shutting down`);
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info(`API ready on http://${env.HOST}:${env.PORT} — docs at /docs`);
} catch (error) {
  app.log.error(error, 'failed to start');
  process.exit(1);
}
