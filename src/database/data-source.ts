import 'reflect-metadata';
import 'dotenv/config';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { getEnv, getEnvNumber } from '../utils/config.js';
import { Location, User } from './entities/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DbPoolConfig {
  poolSize: number;
  connectTimeoutMS: number;
  extra: {
    min: number;
    idleTimeoutMillis: number;
  };
}

export function getDbPoolConfig(): DbPoolConfig {
  return {
    poolSize: getEnvNumber('DB_POOL_MAX', 100),
    connectTimeoutMS: getEnvNumber('DB_CONNECT_TIMEOUT_MS', 5000),
    extra: {
      min: getEnvNumber('DB_POOL_MIN', 2),
      idleTimeoutMillis: getEnvNumber('DB_POOL_IDLE_TIMEOUT_MS', 30000),
    },
  };
}

/**
 * For ESM, TypeORM CLI prefers a direct file path array 
 * instead of dynamic wildcards which fail native import evaluations.
 */
function resolveMigrations(): string[] {
  const distMigrationsDir = path.resolve(process.cwd(), 'dist/database/migrations');
  const targetDir = existsSync(distMigrationsDir) 
    ? distMigrationsDir 
    : path.join(__dirname, 'migrations');

  if (!existsSync(targetDir)) return [];

  // Read filenames and map into exact absolute paths
  return readdirSync(targetDir)
    .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
    .map(file => path.join(targetDir, file));
}

function getBaseDataSourceOptions(url: string): DataSourceOptions {
  const pool = getDbPoolConfig();

  return {
    type: 'postgres',
    url,
    entities: [Location, User],
    synchronize: false,
    poolSize: pool.poolSize,
    connectTimeoutMS: pool.connectTimeoutMS,
    extra: pool.extra,
  };
}

/** Runtime app and tests — migrations are run separately via the TypeORM CLI. */
export function getDataSourceOptions(url: string): DataSourceOptions {
  return getBaseDataSourceOptions(url);
}

/** TypeORM CLI — includes migration paths for `migration:run` and related commands. */
export function getCliDataSourceOptions(url: string): DataSourceOptions {
  return {
    ...getBaseDataSourceOptions(url),
    migrations: resolveMigrations(),
  };
}

export function createAppDataSource(url: string): DataSource {
  return new DataSource(getDataSourceOptions(url));
}

const databaseUrl = getEnv(
  'DATABASE_URL',
  'postgres://app:app_secret@localhost:5433/restaurants',
);

const AppDataSource = new DataSource(getCliDataSourceOptions(databaseUrl));
export default AppDataSource;
