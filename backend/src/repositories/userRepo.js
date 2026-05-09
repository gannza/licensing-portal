const db = require('../db/knex');

async function findByEmail(email) {
  return db('users').where({ email: email.toLowerCase() }).first();
}

async function findById(id) {
  return db('users').where({ id }).first();
}

async function create(data) {
  const [row] = await db('users').insert({ ...data, email: data.email.toLowerCase() }).returning('*');
  return row;
}

async function updateLastLogin(id) {
  return db('users').where({ id }).update({ last_login_at: db.fn.now(), updated_at: db.fn.now() });
}

async function updatePassword(id, password_hash) {
  return db('users').where({ id }).update({ password_hash, must_change_password: false, updated_at: db.fn.now() });
}

async function findAll({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db('users').orderBy('created_at', 'desc').limit(limit).offset(offset),
    db('users').count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

async function updateStatus(id, is_active) {
  const [row] = await db('users').where({ id }).update({ is_active, updated_at: db.fn.now() }).returning('*');
  return row;
}

module.exports = { findByEmail, findById, create, updateLastLogin, updatePassword, findAll, updateStatus };