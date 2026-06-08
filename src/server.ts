import 'dotenv/config';
import 'reflect-metadata';
import { buildApp } from './app.js';
import { loadAppConfig, loadServerOptions } from './utils/index.js';

async function start(): Promise<void> {
  const app = await buildApp(loadAppConfig());
  const { host, port } = loadServerOptions();

  await app.listen({ host, port });
  app.log.info(`Server listening on http://${host}:${port}`);
  app.log.info(`Swagger docs available at http://${host}:${port}/docs`);
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
