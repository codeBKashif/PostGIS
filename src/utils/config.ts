import type { AppConfig } from '../types/index.js';

/**
 * This method gets the environment variable value.
 * @param name - The name of the environment variable
 * @param defaultValue - The default value if the environment variable is not set
 * @returns The environment variable value
 */
export const getEnv = (name: string, defaultValue: string): string => {
  return process.env[name] ?? defaultValue;
};

/**
 * This method gets the environment variable value as a number.
 * @param name - The name of the environment variable
 * @param defaultValue - The default value if the environment variable is not set
 * @returns The environment variable value as a number
 */
export const getEnvNumber = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return Number(value);
};

/**
 * This method loads the application configuration from the environment variables.
 * @returns The application configuration
 */
export const loadAppConfig = (): AppConfig => {
  return {
    databaseUrl: getEnv('DATABASE_URL', 'postgres://app:app_secret@localhost:5433/restaurants'),
    jwtSecret: getEnv('JWT_SECRET', 'my_app_secret'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '1h'),
    redisHost: getEnv('REDIS_HOST', 'localhost'),
    redisPort: getEnvNumber('REDIS_PORT', 6379),
    logger: getEnv('LOGGER', 'true') === 'true' ? true : false,
  };
};

/**
 * This method loads the server options from the environment variables.
 * @returns The server options
 */
export const loadServerOptions = (): { host: string; port: number } => {
  return {
    host: getEnv('HOST', '0.0.0.0'),
    port: getEnvNumber('PORT', 3000),
  };
};
