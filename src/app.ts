import 'reflect-metadata';
import Fastify from 'fastify';
import {
  registerPlugins,
} from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import type { AppConfig } from './types/index.js';

export async function buildApp(config: AppConfig) {
  const fastify = Fastify({
    logger: config.logger ?? true,
  });

  await registerPlugins(fastify, config);

  await registerRoutes(fastify, { jwtExpiresIn: config.jwtExpiresIn });

  return fastify;
}
