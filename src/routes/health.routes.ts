import type { FastifyInstance } from 'fastify';
import { API_VERSION } from '../constants.js';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/health',
    { schema: { hide: true } },
    async () => ({
      status: 'ok',
      version: API_VERSION,
    }),
  );
}
