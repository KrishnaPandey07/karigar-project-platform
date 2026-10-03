/**
 * Section 13 API Standard Envelope Helpers
 */

const sendSuccess = (res, data = null, message = null, statusCode = 200, meta = null) => {
  const payload = { success: true };
  if (data !== null) {
    payload.data = data;
  }
  if (message) {
    payload.message = message;
  }
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const sendError = (res, code, message, statusCode = 400, details = null) => {
  const errorObj = {
    code: code || 'BAD_REQUEST',
    message: message || 'An error occurred during request processing',
  };
  if (details && Array.isArray(details) && details.length > 0) {
    errorObj.details = details;
  } else if (details && typeof details === 'object') {
    errorObj.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
