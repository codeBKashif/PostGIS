import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import type { SwaggerPluginOptions } from '../types/index.js';

export const swaggerPlugin = fp(
  async (fastify: FastifyInstance, options: SwaggerPluginOptions): Promise<void> => {
    
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'Restaurants Finder API',
          description: 'API for searching and managing restaurant locations',
          version: options.apiVersion,
        },
        servers: [
          {
            url: `/v1`,
            description: 'Version 1',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'locations', description: 'Location search and management' },
        ],
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  },
  { name: 'swagger-plugin' },
);
