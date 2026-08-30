import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { AppError } from '../shared/errors.ts';
import { isProduction } from '../config/env.ts';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown; requestId: string };
}

/**
 * Single place where a thrown error becomes an HTTP response, so the client can
 * rely on one error envelope for every failure — which is what its error state
 * renders.
 */
export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        requestId: request.id,
      },
    } satisfies ApiErrorBody);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.info({ err: error }, 'handled application error');
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: request.id,
        },
      } satisfies ApiErrorBody);
    }

    // Fastify's own schema-validation failures.
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.validation,
          requestId: request.id,
        },
      } satisfies ApiErrorBody);
    }

    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    if (status >= 500) request.log.error({ err: error }, 'unhandled error');

    return reply.status(status).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: status >= 500 && isProduction ? 'Internal server error' : error.message,
        requestId: request.id,
      },
    } satisfies ApiErrorBody);
  });
});
