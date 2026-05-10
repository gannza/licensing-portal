const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateTempPassword() {
  return crypto.randomBytes(12).toString('base64').slice(0, 16);
}

module.exports = { hashPassword, verifyPassword, generateTempPassword };
