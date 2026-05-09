const db = require('../db/knex');

async function create(data, trx) {
  const [row] = await (trx || db)('application_stage_reviews').insert(data).returning('*');
  return row;
}

async function findByApplication(application_id) {
  return db('application_stage_reviews')
    .select('application_stage_reviews.*', 'users.full_name as reviewer_name', 'users.email as reviewer_email')
    .join('users', 'users.id', 'application_stage_reviews.reviewed_by')
    .where({ application_id })
    .orderBy('created_at', 'asc');
}

module.exports = { create, findByApplication };
