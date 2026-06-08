import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { UserRole } from '../src/database/enums/user-role.enum.js';

export type TestApp = FastifyInstance & {
  db: DataSource;
};

export interface TestUserCredentials {
  username: string;
  password: string;
  role: UserRole;
}

export const testUsers: Record<'admin' | 'client' | 'guest', TestUserCredentials> = {
  admin: {
    username: 'integration-test-admin',
    password: 'integration-test-password',
    role: UserRole.ADMIN,
  },
  client: {
    username: 'integration-test-client',
    password: 'integration-test-password',
    role: UserRole.CLIENT,
  },
  guest: {
    username: 'integration-test-guest',
    password: 'integration-test-password',
    role: UserRole.GUEST,
  },
};

export const forbiddenResponse = {
  error: 'Forbidden',
  message: 'You are not authorized to access this resource',
};

export async function getAuthToken(
  app: TestApp,
  role: UserRole = UserRole.CLIENT,
): Promise<string> {
  const credentials = Object.values(testUsers).find((user) => user.role === role);

  if (!credentials) {
    throw new Error(`No test user configured for role: ${role}`);
  }

  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/token',
    payload: {
      username: credentials.username,
      password: credentials.password,
    },
  });

  return response.json().access_token as string;
}
