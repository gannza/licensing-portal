const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

function authenticate(req, _res, next) {
  const token = req.cookies.access_token;
  if (!token) return next(new UnauthorizedError('No access token provided'));
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, system_role: payload.system_role };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
