import {
  createUserBodySchema,
  createUserResponseSchema,
  tokenRequestSchema,
  tokenResponseSchema,
} from '../auth.schema.js';
import { errorSchema } from '../error.schema.js';

export const createTokenSwagger = {
  tags: ['auth'],
  summary: 'Obtain a JWT access token',
  description: 'Authenticate with username and password to receive a bearer token.',
  body: tokenRequestSchema,
  response: {
    200: tokenResponseSchema,
    401: errorSchema,
  },
};

export const createUserSwagger = {
  tags: ['auth'],
  summary: 'Create a new user',
  description:
    'Register a new user account with a username and password. Role defaults to client; guest is also allowed. Admin users cannot be created via this endpoint.',
  body: createUserBodySchema,
  response: {
    201: createUserResponseSchema,
    400: errorSchema,
    403: errorSchema,
    409: errorSchema,
  },
};
