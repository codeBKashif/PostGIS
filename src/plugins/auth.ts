import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthPluginOptions } from '../types/index.js';

export const authPlugin = fp(
  async (fastify: FastifyInstance, options: AuthPluginOptions): Promise<void> => {
    
    await fastify.register(jwt, {
      secret: options.secret,
      sign: {
        expiresIn: options.expiresIn ?? '1h',
      },
    });

    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
          await request.jwtVerify();
        } catch {
          return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
        }
      },
    );

    fastify.decorate(
      'authorize',
      (alowedRoles: string[]) => {

        return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {

          const user = request.user;
          if (!user) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
          }
          if (!alowedRoles.includes(user.role)) {
            return reply.code(403).send({ error: 'Forbidden', message: 'You are not authorized to access this resource' });
          }
        };
      },
    );
    
  },
  { name: 'auth-plugin' },
);
