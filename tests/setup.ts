import 'reflect-metadata';
import { faker } from '@faker-js/faker';
import { Redis } from 'ioredis';
import { afterAll, beforeAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { User } from '../src/database/entities/user.entity.js';
import type { AppConfig } from '../src/types/index.js';
import { hashPassword } from '../src/utils/index.js';
import { testUsers, type TestApp } from './helper.js';
import { getTestDatabaseUrl } from './test-database.js';

export const testConfig: AppConfig = {
  databaseUrl: getTestDatabaseUrl(),
  jwtSecret: process.env.JWT_SECRET ?? 'test-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  redisHost: process.env.REDIS_HOST ?? 'localhost',
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  logger: process.env.LOGGER === 'true' ? true : false,
};

let app: TestApp | null = null;
let appPromise: Promise<TestApp> | null = null;

export async function getTestApp(): Promise<TestApp> {
  if (app) {
    return app;
  }

  if (!appPromise) {
    appPromise = (async () => {
      const instance = (await buildApp(testConfig)) as TestApp;
      await seedTestUsers(instance);
      app = instance;
      return instance;
    })();
  }

  return appPromise;
}

async function seedTestUsers(instance: TestApp): Promise<void> {
  for (const credentials of Object.values(testUsers)) {
    await instance.db
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        id: faker.string.uuid(),
        username: credentials.username,
        password_hash: await hashPassword(credentials.password),
        role: credentials.role,
      })
      .orIgnore()
      .execute();
  }
}

beforeAll(async () => {
  const redis = new Redis({
    host: testConfig.redisHost,
    port: testConfig.redisPort,
  });

  try {
    // Clear the Redis database to avoid rate limit issues during tests
    await redis.flushdb();
  } finally {
    await redis.quit();
  }

  await getTestApp();
});

afterAll(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});
