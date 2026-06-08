import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { AuthService, LocationService } from '../services/index.js';

export const servicesPlugin = fp(
  async (fastify: FastifyInstance): Promise<void> => {
    
    fastify.decorate('authService', new AuthService(fastify.db, fastify.log));
    fastify.decorate('locationService', new LocationService(fastify.db, fastify.log));
  },
  { name: 'services-plugin' },
);