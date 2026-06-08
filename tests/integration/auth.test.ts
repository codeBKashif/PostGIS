import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { testUsers } from '../helper.js';
import { getTestApp, testConfig } from '../setup.js';

describe('Auth API', () => {
  it('POST /v1/auth/users creates a new user', async () => {
    const app = await getTestApp();
    const username = faker.internet.username();
    const password = faker.internet.password();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/users',
      payload: { username, password },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toEqual(expect.any(String));
    expect(body.username).toBe(username);
    expect(body.role).toBe('client');

    const tokenResponse = await app.inject({
      method: 'POST',
      url: '/v1/auth/token',
      payload: { username, password },
    });

    expect(tokenResponse.statusCode).toBe(200);
    expect(tokenResponse.json().access_token).toEqual(expect.any(String));
  });

  it('POST /v1/auth/users returns 409 for a duplicate username', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/users',
      payload: {
        username: testUsers.client.username,
        password: faker.internet.password(),
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: 'Conflict',
      message: 'Username already exists',
    });
  });

  it('POST /v1/auth/users creates a guest user when role is guest', async () => {
    const app = await getTestApp();
    const username = faker.internet.username();
    const password = faker.internet.password();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/users',
      payload: { username, password, role: 'guest' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: expect.any(String),
      username,
      role: 'guest',
    });
  });

  it('POST /v1/auth/users rejects admin role in request body', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/users',
      payload: {
        username: faker.internet.username(),
        password: faker.internet.password(),
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /v1/auth/users returns 400 when the request body is invalid', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/users',
      payload: {
        username: faker.internet.username(),
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('POST /v1/auth/token returns a JWT for valid credentials', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/token',
      payload: {
        username: testUsers.client.username,
        password: testUsers.client.password,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.access_token).toEqual(expect.any(String));
    expect(body.access_token.length).toBeGreaterThan(0);
    expect(body.token_type).toBe('Bearer');
    expect(body.expires_in).toBe(testConfig.jwtExpiresIn);
  });

  it('POST /v1/auth/token returns 401 for invalid credentials', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/token',
      payload: {
        username: testUsers.client.username,
        password: faker.internet.password(),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
  });

  it('POST /v1/auth/token returns 401 for an unknown username', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/token',
      payload: {
        username: faker.internet.username(),
        password: faker.internet.password(),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
  });

  it('POST /v1/auth/token returns 400 when the request body is invalid', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/token',
      payload: {
        username: testUsers.client.username,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 401 for protected routes without a token', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/search',
      query: {
        x: String(faker.location.longitude()),
        y: String(faker.location.latitude()),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  });

  it('returns 401 for protected routes with an invalid token', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/search',
      headers: {
        authorization: `Bearer ${faker.string.alphanumeric(32)}`,
      },
      query: {
        x: String(faker.location.longitude()),
        y: String(faker.location.latitude()),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  });
});
