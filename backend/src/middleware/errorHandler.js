const { logger } = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';

  if (statusCode >= 500) {
    const log = req.id ? logger.child(req.id) : logger;
    log.error(`${req.method} ${req.path}`, err.message, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode >= 500 ? 'An unexpected error occurred' : err.message,
    },
    ...(req.id && { request_id: req.id }),
  });
}

module.exports = { errorHandler };
