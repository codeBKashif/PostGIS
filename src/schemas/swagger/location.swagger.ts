import { errorSchema } from '../error.schema.js';
import {
  locationParamsSchema,
  locationSchema,
  searchQuerySchema,
  searchResponseSchema,
  updateLocationBodySchema,
  uploadLocationsBodySchema,
  uploadLocationsResponseSchema,
} from '../location.schema.js';

export const searchLocationsSwagger = {
  tags: ['locations'],
  summary: 'Search locations nearest to the given coordinates',
  description:
    'Uses PostGIS KNN search with a GiST index on the geom column. ' +
    'Returns locations ordered by distance from the query point.',
  security: [{ bearerAuth: [] }],
  querystring: searchQuerySchema,
  response: {
    200: searchResponseSchema,
    400: errorSchema,
    401: errorSchema,
  },
};

export const getLocationByIdSwagger = {
  tags: ['locations'],
  summary: 'Get a location by ID',
  description: 'Returns a single location record by UUID.',
  security: [{ bearerAuth: [] }],
  params: locationParamsSchema,
  response: {
    200: locationSchema,
    404: errorSchema,
  },
};

export const uploadLocationsSwagger = {
  tags: ['locations'],
  summary: 'Upload locations from a JSON file',
  description:
    'Upload a JSON file via multipart/form-data. ' +
    'The file must contain a top-level object with a "locations" array, e.g. ' +
    '{ "locations": [{ "name": "...", "type": "...", "coordinates": "x=1,y=2", "radius": 10 }] }. ' +
    'Large files are streamed and inserted in batches.',
  security: [{ bearerAuth: [] }],
  consumes: ['multipart/form-data'],
  body: uploadLocationsBodySchema,
  response: {
    201: uploadLocationsResponseSchema,
    400: errorSchema,
    401: errorSchema,
  },
};

export const updateLocationSwagger = {
  tags: ['locations'],
  summary: 'Update a location by ID',
  description: 'Updates one or more fields on an existing location. Requires authentication.',
  security: [{ bearerAuth: [] }],
  params: locationParamsSchema,
  body: updateLocationBodySchema,
  response: {
    200: locationSchema,
    400: errorSchema,
    401: errorSchema,
    404: errorSchema,
  },
};
