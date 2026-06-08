import { FastifyInstance } from "fastify";
import { AppConfig } from "../types/index.js";
import { API_VERSION } from "../constants.js";

import { errorHandlerPlugin } from "./error-handler.js";
import { dbPlugin } from "./db.js";
import { redisPlugin } from "./redis.js";
import { swaggerPlugin } from "./swagger.js";
import { rateLimitPlugin } from "./rate-limit.js";
import { authPlugin } from "./auth.js";
import { servicesPlugin } from "./services.js";
import { multipartPlugin } from "./multipart.js";

/**
 * This function registers all the plugins for the fastify instance.
 * @param fastify - The fastify instance
 * @param config - The application configuration
 * @returns A promise that resolves when the plugins are registered
 */
export const registerPlugins = async (fastify: FastifyInstance, config: AppConfig): Promise<void> => {
    await fastify.register(errorHandlerPlugin);
    await fastify.register(dbPlugin, { databaseUrl: config.databaseUrl });
    await fastify.register(redisPlugin, { host: config.redisHost, port: config.redisPort });
    await fastify.register(swaggerPlugin, { apiVersion: API_VERSION });
    await fastify.register(rateLimitPlugin);
  
    await fastify.register(authPlugin, {
      secret: config.jwtSecret,
      expiresIn: config.jwtExpiresIn,
    });
    await fastify.register(servicesPlugin);
    await fastify.register(multipartPlugin);
  };