import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Redis } from "ioredis";


export interface RedisPluginOptions {
  host: string;
  port: number;
}

export const redisPlugin = fp(async (fastify: FastifyInstance, options: RedisPluginOptions): Promise<void> => {
  const redis = new Redis({
    host: options.host,
    port: options.port,
  });
  fastify.decorate('redis', redis);

  // Clean up connections gracefully on shutdown
  fastify.addHook('onClose', async () => {
    await redis.quit();
  });

}, { name: 'redis-plugin' });