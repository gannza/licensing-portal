const { v4: uuidv4 } = require('uuid');
const userRepo = require('../repositories/userRepo');
const institutionRepo = require('../repositories/institutionRepo');
const auditRepo = require('../repositories/auditRepo');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { UnauthorizedError, ValidationError, ConflictError } = require('../utils/errors');
const db = require('../db/knex');

async function register({ email, password, full_name, phone, institution_name, institution_registration_number }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError('Email already registered');

  const existingInst = await institutionRepo.findByRegistrationNumber(institution_registration_number);
  if (existingInst) throw new ConflictError('Institution registration number already registered');

  const password_hash = await hashPassword(password);

  return db.transaction(async (trx) => {
    const user = await trx('users').insert({
      id: uuidv4(),
      email: email.toLowerCase(),
      password_hash,
      full_name,
      phone,
      system_role: 'APPLICANT',
    }).returning('*').then(r => r[0]);

    await trx('institutions').insert({
      id: uuidv4(),
      applicant_user_id: user.id,
      name: institution_name,
      registration_number: institution_registration_number,
    });

    await auditRepo.create({
      id: uuidv4(),
      acting_user_id: user.id,
      action: 'USER_REGISTERED',
      metadata: JSON.stringify({ email: user.email, full_name: user.full_name }),
    }, trx);

    const tokens = issueTokens(user);
    return { user: sanitize(user), ...tokens };
  });
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.is_active) throw new UnauthorizedError('Invalid credentials');

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  await userRepo.updateLastLogin(user.id);

  const tokens = issueTokens(user);

  if (user.must_change_password) {
    return { must_change_password: true, user: sanitize(user), ...tokens };
  }

  return { user: sanitize(user), ...tokens };
}

async function changePassword(userId, { current_password, new_password }) {
  const user = await userRepo.findById(userId);
  if (!user) throw new UnauthorizedError();

  if (!user.must_change_password) {
    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) throw new ValidationError('Current password is incorrect');
  }

  const password_hash = await hashPassword(new_password);
  await userRepo.updatePassword(userId, password_hash);

  const updated = await userRepo.findById(userId);
  const tokens = issueTokens(updated);
  return { user: sanitize(updated), ...tokens };
}

function issueTokens(user) {
  const payload = { sub: user.id, system_role: user.system_role };
  return {
    access_token: signAccessToken(payload),
    refresh_token: signRefreshToken(payload),
  };
}

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

module.exports = { register, login, changePassword, issueTokens, sanitize };
