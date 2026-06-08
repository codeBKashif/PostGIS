export const API_VERSION = 'v1';
export const LOCATIONS_IMPORT_KEY = 'locations';
export const SALT_ROUNDS = 10;

export const COORDINATES_XY_PATTERN = /^x=(-?\d+(?:\.\d+)?),y=(-?\d+(?:\.\d+)?)$/i;

export const FORBIDDEN_ROLE = 'forbidden_role' as const;

export const AUTH_BYPASS_PATHS = [
  '/health',
  '/v1/auth/token',
  '/v1/auth/users',
  '/docs',
];

export const IMPORT_BATCH_SIZE = 500;
export const MAX_RADIUS = 2500;