const { ValidationError } = require('../utils/errors');

/**
 * Higher-order middleware to validate req.body, req.query, or req.params against a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      return next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          rule: e.code,
        }));
        return next(new ValidationError('Validation failed for ' + source, details));
      }
      return next(err);
    }
  };
};

module.exports = validate;
