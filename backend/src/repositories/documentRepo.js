const db = require('../db/knex');

async function create(data, trx) {
  const [row] = await (trx || db)('application_documents').insert(data).returning('*');
  return row;
}

async function findLatestForCycle(application_id, requirement_key, submission_cycle) {
  return db('application_documents')
    .where({ application_id, requirement_key, submission_cycle })
    .whereNull('superseded_by')
    .orderBy('uploaded_at', 'desc')
    .first();
}

async function findAllForApplication(application_id, submission_cycle) {
  const query = db('application_documents').where({ application_id }).orderBy('uploaded_at', 'desc');
  if (submission_cycle !== undefined) query.where({ submission_cycle });
  return query;
}

async function findHistory(application_id, requirement_key) {
  return db('application_documents')
    .where({ application_id, requirement_key })
    .orderBy('submission_cycle', 'desc')
    .orderBy('uploaded_at', 'desc');
}

async function markSuperseded(id, superseded_by, trx) {
  return (trx || db)('application_documents').where({ id }).update({ superseded_by });
}

async function findById(id) {
  return db('application_documents').where({ id }).first();
}

module.exports = { create, findLatestForCycle, findAllForApplication, findHistory, markSuperseded, findById };
