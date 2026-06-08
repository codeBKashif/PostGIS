import { describe, expect, it } from 'vitest';
import { API_VERSION } from '../../src/constants.js';
import { getTestApp } from '../setup.js';

describe('Health API', () => {
  it('GET /health returns ok without authentication', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      version: API_VERSION,
    });
  });
});
