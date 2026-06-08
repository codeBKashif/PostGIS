import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { API_VERSION } from '../constants.js';
import type { RouteOptions } from '../types/index.js';
import { isAuthBypassed } from '../utils/index.js';
import { authRoutes } from './auth.routes.js';
import { healthRoutes } from './health.routes.js';
import { locationRoutes } from './location.routes.js';



export async function registerRoutes(
  fastify: FastifyInstance,
  options: RouteOptions,
): Promise<void> {
  await fastify.register(healthRoutes);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (isAuthBypassed(request.url)) {
      return;
    } else {
      await fastify.authenticate(request, reply);
    }

  });

  await fastify.register(
    async (v1) => {
      
      await v1.register(authRoutes, { expiresIn: options.jwtExpiresIn });
      await v1.register(locationRoutes);
    },
    { prefix: `/${API_VERSION}` },
  );
}
