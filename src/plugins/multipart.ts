import multipart from '@fastify/multipart';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export const multipartPlugin = fp(
  async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    });
  },
  { name: 'multipart-plugin' },
);
