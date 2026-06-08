export const tokenRequestSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 1 },
    password: { type: 'string', minLength: 1 },
  },
  required: ['username', 'password'],
  additionalProperties: false,
};

export const tokenResponseSchema = {
  type: 'object',
  properties: {
    access_token: { type: 'string' },
    token_type: { type: 'string', enum: ['Bearer'] },
    expires_in: { type: 'string' },
  },
  required: ['access_token', 'token_type', 'expires_in'],
  additionalProperties: false,
};

export const createUserBodySchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 1 },
    password: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: ['client', 'guest'] },
  },
  required: ['username', 'password'],
  additionalProperties: false,
};

export const createUserResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    username: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: ['admin', 'client', 'guest'] },
  },
  required: ['id', 'username', 'role'],
  additionalProperties: false,
};
