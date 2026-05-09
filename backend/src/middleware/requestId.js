const { randomBytes } = require('crypto');

function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || randomBytes(8).toString('hex');
  res.setHeader('x-request-id', req.id);
  next();
}

module.exports = { requestId };
