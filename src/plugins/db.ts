import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { closeDb, createDb } from "../database/index.js";

export interface DbPluginOptions {
  databaseUrl: string;
}
export const dbPlugin = fp(async (fastify: FastifyInstance, options: DbPluginOptions) => {
  const db = await createDb(options.databaseUrl);

  fastify.decorate('db', db);

  // Clean up connections gracefully on shutdown
  fastify.addHook('onClose', async () => {
    await closeDb();
  });
  
}, { name: 'db-plugin' });