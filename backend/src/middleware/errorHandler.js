const { sendError } = require('../utils/responseEnvelope');
const { AppError } = require('../utils/errors');
const { ZodError } = require('zod');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));
    return sendError(res, 'VALIDATION_ERROR', 'Request validation failed', 422, details);
  }

  // 2. Custom AppError instances or errors with statusCode
  if (err instanceof AppError || err.statusCode) {
    return sendError(res, err.code || 'ERROR', err.message, err.statusCode || 500, err.details);
  }

  // 3. Prisma Known Request Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = err.meta?.target ? `Duplicate value for field(s): ${err.meta.target}` : 'Unique constraint violation';
      return sendError(res, 'CONFLICT', target, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'NOT_FOUND', 'Requested record not found in database', 404);
    }
    if (err.code === 'P2003') {
      return sendError(res, 'FOREIGN_KEY_VIOLATION', 'Foreign key constraint failed', 400);
    }
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
  }

  // 5. JSON Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'INVALID_JSON', 'Malformed JSON in request payload', 400);
  }

  // 6. Generic unhandled error
  console.error('[UNHANDLED_ERROR]:', err);
  const message = process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message;
  return sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

module.exports = errorHandler;
