import type { FastifyInstance } from 'fastify';
import {
  getLocationByIdSwagger,
  searchLocationsSwagger,
  updateLocationSwagger,
  uploadLocationsSwagger,
} from '../schemas/index.js';
import { UserRole } from '../database/enums/user-role.enum.js';

export async function locationRoutes(fastify: FastifyInstance): Promise<void> {
  
  

  fastify.get(
    '/locations/search',
    {
      onRequest: fastify.authorize([UserRole.CLIENT, UserRole.ADMIN, UserRole.GUEST]),
      schema: searchLocationsSwagger,
    },
    async (request) => {
      const query = request.query as { x: number; y: number; limit?: number };
      return fastify.locationService.search(query);
    },
  );

  fastify.get(
    '/locations/:id',
    {
      onRequest: fastify.authorize([UserRole.CLIENT, UserRole.ADMIN, UserRole.GUEST]),
      schema: getLocationByIdSwagger,
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const location = await fastify.locationService.getById(id);

      if (!location) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Location with id ${id} not found`,
        });
      }

      return location;
    },
  );

  fastify.put(
    '/locations/:id',
    {
      onRequest: fastify.authorize([UserRole.ADMIN, UserRole.CLIENT]),
      schema: updateLocationSwagger,
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const location = await fastify.locationService.update(id, body);

      if (!location) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Location with id ${id} not found`,
        });
      }

      return location;
    },
  );

  fastify.post(
    '/locations/upload',
    {
      onRequest: fastify.authorize([UserRole.ADMIN]),
      schema: uploadLocationsSwagger,
      validatorCompiler: () => () => true,
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const uploadedFile = await request.file();

      if (!uploadedFile) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'JSON file is required',
        });
      }

      try {
        
        const result = await fastify.locationService.importJsonArrayStream(uploadedFile.file);
        return reply.code(201).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';

        if (message === 'Invalid JSON file' || message.startsWith('JSON file must contain a "')) {
          return reply.code(400).send({
            error: 'Bad Request',
            message,
          });
        }

        throw error;
      }
    },
  );
}
