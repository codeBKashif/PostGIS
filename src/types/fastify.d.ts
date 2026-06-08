import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DataSource } from 'typeorm';
import type { AuthService, LocationService } from '../services/index.js';
import type { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (alowedRoles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    redis: Redis;
    authService: AuthService;
    locationService: LocationService;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; username: string; role: string };
    user: { sub: string; username: string; role: string };
  }
}

export {};
