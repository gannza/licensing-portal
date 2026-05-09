const { ForbiddenError } = require('../utils/errors');

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError());
    if (!roles.includes(req.user.system_role)) {
      return next(new ForbiddenError(`Requires one of: ${roles.join(', ')}`));
    }
    next();
  };
}

module.exports = { requireRole };
