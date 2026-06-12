const logger = require('../config/logger');

/**
 * Formats errors for development (detailed) vs production (sanitized).
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error using Winston
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production environment
    if (err.isOperational) {
      // Trustworthy operational error: send message to client
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or other unknown error: don't leak leak details
      logger.error('CRITICAL INTERNAL ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our end.'
      });
    }
  }
};
