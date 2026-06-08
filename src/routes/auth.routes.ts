import type { FastifyInstance } from 'fastify';
import { FORBIDDEN_ROLE } from '../constants.js';
import { UserRole } from '../database/enums/user-role.enum.js';
import { createTokenSwagger, createUserSwagger } from '../schemas/index.js';

export interface AuthRouteOptions {
  expiresIn: string;
}

export async function authRoutes(
  fastify: FastifyInstance,
  options: AuthRouteOptions,
): Promise<void> {

  fastify.post(
    '/auth/token',
    {
      schema: createTokenSwagger,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        }
      },
    },
    async (request, reply) => {
      const { username, password } = request.body as {
        username: string;
        password: string;
      };

      const user = await fastify.authService.validateCredentials(username, password);
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      const accessToken = await reply.jwtSign({
        sub: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: options.expiresIn,
      };
    },
  );

  fastify.post(
    '/auth/users',
    {
      schema: createUserSwagger,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        }
      },
    },
    async (request, reply) => {
      const { username, password, role } = request.body as {
        username: string;
        password: string;
        role?: UserRole;
      };

      const user = await fastify.authService.createUser(username, password, role);
      
      if (user === FORBIDDEN_ROLE) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin users cannot be created via this endpoint',
        });
      }

      if (!user) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Username already exists',
        });
      }

      return reply.code(201).send(user);
    },
  );
}
