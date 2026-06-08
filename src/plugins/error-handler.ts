import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply => {
  request.log.error(error);

  if (error.validation) {
    return reply.code(400).send({
      error: 'Bad Request',
      message: error.message,
    });
  }

  return reply.code(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

export const errorHandlerPlugin = fp(
  async (fastify: FastifyInstance): Promise<void> => {
    fastify.setErrorHandler(errorHandler);
  },
  { name: 'error-handler-plugin' },
);
