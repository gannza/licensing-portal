const { ValidationError } = require('./errors');

function validate(schema) {
  return (req, _res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new ValidationError(error.details.map(d => d.message).join('; ')));
    next();
  };
}

module.exports = { validate };
