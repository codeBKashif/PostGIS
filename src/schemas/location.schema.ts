const coordinateProperty = { type: 'number' };

export const searchQuerySchema = {
  type: 'object',
  properties: {
    x: coordinateProperty,
    y: coordinateProperty,
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
  },
  required: ['x', 'y'],
  additionalProperties: false,
};

export const locationParamsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
  required: ['id'],
  additionalProperties: false,
};

export const updateLocationBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', minLength: 1 },
    radius: { type: 'number', minimum: 0 },
    x: coordinateProperty,
    y: coordinateProperty,
  },
  minProperties: 1,
  additionalProperties: false,
};

export const locationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', minLength: 1 },
    radius: { type: 'number', minimum: 0 },
    x: coordinateProperty,
    y: coordinateProperty,
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'type', 'radius', 'x', 'y', 'created_at', 'updated_at'],
  additionalProperties: false,
};

export const locationSearchResultSchema = {
  type: 'object',
  properties: {
    ...locationSchema.properties,
    distance: { type: 'number', minimum: 0 },
  },
  required: [...locationSchema.required, 'distance'],
  additionalProperties: false,
};

export const uploadLocationsBodySchema = {
  type: 'object',
  properties: {
    file: { type: 'string', format: 'binary' },
  },
  required: ['file'],
  additionalProperties: false,
};

export const uploadLocationsResponseSchema = {
  type: 'object',
  properties: {
    inserted: { type: 'integer', minimum: 0 },
    errors: { type: 'integer', minimum: 0 },
  },
  required: ['inserted', 'errors'],
  additionalProperties: false,
};

export const searchResponseSchema = {
  type: 'object',
  properties: {
    userLocation: {
      type: 'string',
      pattern: '^x=-?\\d+(\\.\\d+)?,y=-?\\d+(\\.\\d+)?$',
    },
    locations: {
      type: 'array',
      items: locationSearchResultSchema,
    },
  },
  required: ['userLocation', 'locations'],
  additionalProperties: false,
};
