const AppError = require('../utils/appError');

/**
 * Express middleware to validate request payloads using Joi schemas.
 * @param {Object} schemas - Object containing Joi schemas for body, query, or params.
 */
const validate = (schemas) => {
  return (req, res, next) => {
    const locations = ['body', 'query', 'params'];

    for (const location of locations) {
      if (schemas[location]) {
        const { error, value } = schemas[location].validate(req[location], {
          abortEarly: false,
          stripUnknown: true, // remove fields not defined in Joi schema
          errors: {
            wrap: {
              label: ''
            }
          }
        });

        if (error) {
          const errorMessage = error.details.map((detail) => detail.message).join(', ');
          return next(new AppError(`Validation error: ${errorMessage}`, 400));
        }

        // Reassign validated and sanitized value back to the request object
        req[location] = value;
      }
    }

    next();
  };
};

module.exports = validate;
