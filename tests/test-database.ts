import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const DEFAULT_TEST_DATABASE_URL = 'postgres://app:app_secret@localhost:5433/restaurants_test';

export function getTestDatabaseUrl(): string {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

  return testDatabaseUrl;
}

async function ensureTestDatabaseExists(testDatabaseUrl: string): Promise<void> {
  const url = new URL(testDatabaseUrl);
  const testDatabaseName = url.pathname.replace(/^\//, '');

  const testClient = new Client({ connectionString: testDatabaseUrl });
  try {
    await testClient.connect();
    return;
  } catch {
    // Database does not exist yet — create it below.
  } finally {
    await testClient.end().catch(() => {});
  }

  url.pathname = '/postgres';
  const adminClient = new Client({ connectionString: url.toString() });

  try {
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE ${testDatabaseName}`);
    console.log(`Created test database "${testDatabaseName}"`);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

function runMigrations(testDatabaseUrl: string): void {
  const result = spawnSync('npm', ['run', 'typeorm', '--', 'migration:run'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export async function prepareTestDatabase(): Promise<void> {
  const testDatabaseUrl = getTestDatabaseUrl();
  await ensureTestDatabaseExists(testDatabaseUrl);
  runMigrations(testDatabaseUrl);
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  prepareTestDatabase().catch((error: unknown) => {
    console.error('Failed to prepare test database:', error);
    process.exit(1);
  });
}
