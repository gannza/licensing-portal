const db = require('../db/knex');

async function create(data, trx) {
  const [row] = await (trx || db)('audit_logs').insert(data).returning('*');
  return row;
}

async function findByApplication(application_id, { page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db('audit_logs')
      .select('audit_logs.*', 'users.full_name as actor_name', 'users.email as actor_email')
      .join('users', 'users.id', 'audit_logs.acting_user_id')
      .where({ application_id })
      .orderBy('created_at', 'asc')
      .limit(limit).offset(offset),
    db('audit_logs').where({ application_id }).count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

async function findAll({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db('audit_logs')
      .select('audit_logs.*', 'users.full_name as actor_name', 'users.email as actor_email')
      .join('users', 'users.id', 'audit_logs.acting_user_id')
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit).offset(offset),
    db('audit_logs').count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

module.exports = { create, findByApplication, findAll };
