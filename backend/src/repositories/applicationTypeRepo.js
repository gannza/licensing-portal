const db = require('../db/knex');

async function findAll(is_admin = false) {
  let types;
  if (is_admin) {
    types = await db('application_types').orderBy('name');
  } else {
    types = await db('application_types').where({ is_active: true }).orderBy('name');
  }
  const result = [];
  for (const t of types) {
    const requirements = await db('document_requirements')
      .where({ application_type_id: t.id })
      .orderBy('display_order');
    result.push({ ...t, document_requirements: requirements });
  }
  return result;
}


async function findById(id) {
  const type = await db('application_types').where({ id }).first();
  if (!type) return null;
  const requirements = await db('document_requirements')
    .where({ application_type_id: id })
    .orderBy('display_order');
  return { ...type, document_requirements: requirements };
}

async function createApplicationType(data) {
  const [row] = await db('application_types').insert(data).returning('*');
  return { ...row, document_requirements: [] };
}

async function updateApplicationType(id, data) {
  const [row] = await db('application_types').where({ id }).update(data).returning('*');
  return row;
}

async function deleteApplicationType(id) {
  await await db('application_types').where({ id }).delete();
}


module.exports = { createApplicationType, findById, updateApplicationType, deleteApplicationType, findAll };