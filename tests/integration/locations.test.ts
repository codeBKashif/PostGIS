import { faker } from '@faker-js/faker';
import { describe, expect, it, beforeEach } from 'vitest';
import { UserRole } from '../../src/database/enums/user-role.enum.js';
import { Location } from '../../src/database/entities/location.entity.js';
import { forbiddenResponse, getAuthToken } from '../helper.js';
import { getTestApp } from '../setup.js';

interface TestLocation {
  id: string;
  name: string;
  type: string;
  radius: number;
  x: number;
  y: number;
}

const SEARCH_ANCHOR = { x: 500, y: 500 };

function buildLocation(overrides: Partial<TestLocation> = {}): TestLocation {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: faker.helpers.arrayElement(['Restaurant', 'Cafe', 'Bar']),
    radius: faker.number.int({ min: 10, max: 100 }),
    x: SEARCH_ANCHOR.x,
    y: SEARCH_ANCHOR.y,
    ...overrides,
  };
}

function buildNearbyLocation(
  anchor: TestLocation,
  overrides: Partial<TestLocation> = {},
): TestLocation {
  return buildLocation({
    x: anchor.x + 2,
    y: anchor.y + 1,
    radius: 500,
    ...overrides,
  });
}

function toLocationRecord(location: TestLocation): Record<string, unknown> {
  return {
    id: location.id,
    name: location.name,
    type: location.type,
    coordinates: `x=${location.x},y=${location.y}`,
    radius: location.radius,
  };
}

function toLocationsFile(locations: Record<string, unknown>[]): string {
  return JSON.stringify({ locations });
}

function buildMultipartPayload(filename: string, content: string): {
  payload: string;
  contentType: string;
} {
  const boundary = '----vitest-boundary';
  const payload =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--\r\n`;

  return {
    payload,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe('Locations API', () => {
  let nearestLocation: TestLocation;
  let fartherLocation: TestLocation;
  let adminToken: string;
  let clientToken: string;
  let guestToken: string;

  beforeEach(async () => {
    const app = await getTestApp();
    adminToken = await getAuthToken(app, UserRole.ADMIN);
    clientToken = await getAuthToken(app, UserRole.CLIENT);
    guestToken = await getAuthToken(app, UserRole.GUEST);
    nearestLocation = buildLocation({ radius: 100 });
    fartherLocation = buildNearbyLocation(nearestLocation);

    await app.db.query('TRUNCATE TABLE locations');

    await app.db.getRepository(Location).save([nearestLocation, fartherLocation]);
  });

  it('GET /v1/locations/search returns nearest locations ordered by distance', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/locations/search',
      headers: {
        authorization: `Bearer ${clientToken}`,
      },
      query: {
        x: String(nearestLocation.x),
        y: String(nearestLocation.y),
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.userLocation).toBe(`x=${nearestLocation.x},y=${nearestLocation.y}`);
    expect(body.locations.length).toBe(2);
    expect(body.locations[0].name).toBe(nearestLocation.name);
    expect(body.locations[0].distance).toBe(0);
    expect(body.locations[1].name).toBe(fartherLocation.name);
  });

  it('GET /v1/locations/:id returns a single location', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: `/v1/locations/${nearestLocation.id}`,
      headers: {
        authorization: `Bearer ${clientToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe(nearestLocation.name);
  });

  it('GET /v1/locations/:id returns 404 for unknown id', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'GET',
      url: `/v1/locations/${faker.string.uuid()}`,
      headers: {
        authorization: `Bearer ${clientToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('PUT /v1/locations/:id requires authentication', async () => {
    const app = await getTestApp();

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/locations/${nearestLocation.id}`,
      payload: { name: faker.company.name() },
    });

    expect(response.statusCode).toBe(401);
  });

  it('PUT /v1/locations/:id updates a location with a client token', async () => {
    const app = await getTestApp();
    const updatedName = faker.company.name();

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/locations/${nearestLocation.id}`,
      headers: {
        authorization: `Bearer ${clientToken}`,
      },
      payload: { name: updatedName },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe(updatedName);
  });

  it('PUT /v1/locations/:id updates a location with an admin token', async () => {
    const app = await getTestApp();
    const updatedName = faker.company.name();

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/locations/${nearestLocation.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: { name: updatedName },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe(updatedName);
  });

  it('POST /v1/locations/upload requires authentication', async () => {
    const app = await getTestApp();
    const { payload, contentType } = buildMultipartPayload(
      'locations.json',
      toLocationsFile([toLocationRecord(buildLocation())]),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        'content-type': contentType,
      },
      payload,
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /v1/locations/upload imports locations from a JSON file as admin', async () => {
    const app = await getTestApp();
    await app.db.query('TRUNCATE TABLE locations');

    const locationA = buildLocation({ radius: 100 });
    const locationB = buildNearbyLocation(locationA);
    const json = toLocationsFile([
      toLocationRecord(locationA),
      toLocationRecord(locationB),
    ]);
    const { payload, contentType } = buildMultipartPayload('locations.json', json);

    const uploadResponse = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': contentType,
      },
      payload,
    });

    expect(uploadResponse.statusCode).toBe(201);
    expect(uploadResponse.json()).toEqual({ inserted: 2, errors: 0 });

    const searchResponse = await app.inject({
      method: 'GET',
      url: '/v1/locations/search',
      headers: {
        authorization: `Bearer ${clientToken}`,
      },
      query: {
        x: String(locationA.x),
        y: String(locationA.y),
      },
    });

    expect(searchResponse.statusCode).toBe(200);
    expect(searchResponse.json().locations).toHaveLength(2);
  });

  it('POST /v1/locations/upload rejects invalid JSON files', async () => {
    const app = await getTestApp();
    const { payload, contentType } = buildMultipartPayload('locations.json', '{ invalid json');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': contentType,
      },
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Invalid JSON file');
  });

  it('POST /v1/locations/upload rejects files without a locations array', async () => {
    const app = await getTestApp();
    const { payload, contentType } = buildMultipartPayload(
      'locations.json',
      JSON.stringify({ places: [] }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': contentType,
      },
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('JSON file must contain a "locations" array');
  });

  it('POST /v1/locations/upload skips duplicate name and coordinates', async () => {
    const app = await getTestApp();
    await app.db.query('TRUNCATE TABLE locations');

    const location = buildLocation();
    const json = toLocationsFile([toLocationRecord(location)]);
    const { payload, contentType } = buildMultipartPayload('locations.json', json);

    const firstUpload = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': contentType,
      },
      payload,
    });

    const duplicateUpload = await app.inject({
      method: 'POST',
      url: '/v1/locations/upload',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': contentType,
      },
      payload,
    });

    expect(firstUpload.statusCode).toBe(201);
    expect(firstUpload.json()).toEqual({ inserted: 1, errors: 0 });
    expect(duplicateUpload.statusCode).toBe(201);
    expect(duplicateUpload.json()).toEqual({ inserted: 0, errors: 1 });
  });

  describe('role-based authorization', () => {
    it('allows guest to search locations', async () => {
      const app = await getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: '/v1/locations/search',
        headers: {
          authorization: `Bearer ${guestToken}`,
        },
        query: {
          x: String(nearestLocation.x),
          y: String(nearestLocation.y),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().locations).toHaveLength(2);
    });

    it('allows guest to get a location by id', async () => {
      const app = await getTestApp();

      const response = await app.inject({
        method: 'GET',
        url: `/v1/locations/${nearestLocation.id}`,
        headers: {
          authorization: `Bearer ${guestToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().name).toBe(nearestLocation.name);
    });

    it('forbids guest from updating a location', async () => {
      const app = await getTestApp();

      const response = await app.inject({
        method: 'PUT',
        url: `/v1/locations/${nearestLocation.id}`,
        headers: {
          authorization: `Bearer ${guestToken}`,
        },
        payload: { name: faker.company.name() },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual(forbiddenResponse);
    });

    it('forbids guest from uploading locations', async () => {
      const app = await getTestApp();
      const { payload, contentType } = buildMultipartPayload(
        'locations.json',
        toLocationsFile([toLocationRecord(buildLocation())]),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/v1/locations/upload',
        headers: {
          authorization: `Bearer ${guestToken}`,
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual(forbiddenResponse);
    });

    it('forbids client from uploading locations', async () => {
      const app = await getTestApp();
      const { payload, contentType } = buildMultipartPayload(
        'locations.json',
        toLocationsFile([toLocationRecord(buildLocation())]),
      );

      const response = await app.inject({
        method: 'POST',
        url: '/v1/locations/upload',
        headers: {
          authorization: `Bearer ${clientToken}`,
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual(forbiddenResponse);
    });
  });
});
