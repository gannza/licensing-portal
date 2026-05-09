const db = require('../db/knex');

async function create(data) {
  const [row] = await db('institutions').insert(data).returning('*');
  return row;
}

async function findByUserId(applicant_user_id) {
  return db('institutions').where({ applicant_user_id }).first();
}

async function findByRegistrationNumber(registration_number) {
  return db('institutions').where({ registration_number }).first();
}

module.exports = { create, findByUserId, findByRegistrationNumber };
