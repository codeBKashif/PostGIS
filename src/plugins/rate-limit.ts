import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

export const rateLimitPlugin = fp(
  async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(rateLimit, {
      global: false,
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
      redis: new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      }),
      keyGenerator: (req) => req.user?.sub ?? req.ip,
    });
  },
  { name: 'rate-limit-plugin' },
);
