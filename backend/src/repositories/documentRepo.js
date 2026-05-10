const db = require('../db/knex');

async function create(data, trx) {
  const [row] = await (trx || db)('application_documents').insert(data).returning('*');
  return row;
}

async function findLatestForCycle(application_id, requirement_key, submission_cycle) {
  return await db('application_documents')
    .where({ application_id, requirement_key, submission_cycle })
    .whereNull('superseded_by')
    .orderBy('uploaded_at', 'desc')
    .first();
}

async function findAllDocumentsForApplication(application_id) {
  const query =  db('application_documents').where({ application_id }).orderBy('uploaded_at', 'desc');
  return query;
}

async function findHistory(application_id, requirement_key) {
  return await db('application_documents')
    .where({ application_id, requirement_key })
    .orderBy('submission_cycle', 'desc')
    .orderBy('uploaded_at', 'desc');
}

async function markSuperseded(id, superseded_by, trx) {
  return await (trx || db)('application_documents').where({ id }).update({ superseded_by });
}

async function findById(id) {
  return await db('application_documents').where({ id }).first();
}

// Admin: Document Requirements

async function findDocumentRequirementById(id) {
  return await db('document_requirements').where({ id }).first();
}

async function createDocumentRequirement(data) {
  const [row] = await db('document_requirements').insert(data).returning('*');
  return row;
}

async function updateDocumentRequirement(id, data) {
  const [row] = await db('document_requirements').where({ id }).update(data).returning('*');
  return row;
}

async function deleteDocumentRequirement(id) {
  await await db('document_requirements').where({ id }).delete();
}

async function findDocumentRequirementByApplicationTypeId(application_type_id) {
 return await db("document_requirements").where({
      application_type_id: application_type_id,
    });
}

async function findDocRequirementByTypeIdKey(application_type_id, key) {
 return await db("document_requirements").where({
      application_type_id: application_type_id,
      key: key
    }).first();
}

module.exports = { create, findLatestForCycle, findAllDocumentsForApplication, findHistory, markSuperseded, findById, findDocumentRequirementById, createDocumentRequirement, updateDocumentRequirement, deleteDocumentRequirement, findDocumentRequirementByApplicationTypeId, findDocRequirementByTypeIdKey  };
