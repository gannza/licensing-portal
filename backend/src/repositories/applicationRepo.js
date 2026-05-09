const db = require('../db/knex');

async function create(data) {
  const [row] = await db('applications').insert(data).returning('*');
  return row;
}

async function findById(id) {
  return db('applications').where({ id }).first();
}

async function findByIdWithDetails(id) {
  const app = await db('applications')
    .select(
      'applications.*',
      'application_types.name as type_name',
      'application_types.code as type_code',
      'users.full_name as applicant_name',
      'users.email as applicant_email',
      'reviewer.full_name as reviewer_name',
    )
    .join('application_types', 'application_types.id', 'applications.application_type_id')
    .join('users', 'users.id', 'applications.applicant_id')
    .leftJoin('users as reviewer', 'reviewer.id', 'applications.reviewed_by')
    .where('applications.id', id)
    .first();
  return app;
}

async function findByApplicant(applicant_id, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db('applications')
      .select('applications.*', 'application_types.name as type_name', 'application_types.code as type_code')
      .join('application_types', 'application_types.id', 'applications.application_type_id')
      .where('applications.applicant_id', applicant_id)
      .orderBy('applications.created_at', 'desc')
      .limit(limit).offset(offset),
    db('applications').where({ applicant_id }).count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

async function findByWorkflowRole(workflow_id, states, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const [rows, [{ count }]] = await Promise.all([
    db('applications')
      .select('applications.*', 'application_types.name as type_name', 'application_types.code as type_code', 'users.full_name as applicant_name')
      .join('application_types', 'application_types.id', 'applications.application_type_id')
      .join('users', 'users.id', 'applications.applicant_id')
      .where('applications.workflow_id', workflow_id)
      .whereIn('applications.current_state', states)
      .orderBy('applications.updated_at', 'desc')
      .limit(limit).offset(offset),
    db('applications').where({ workflow_id }).whereIn('current_state', states).count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

async function findAll({ page = 1, limit = 20, state, workflow_id } = {}) {
  const offset = (page - 1) * limit;
  let query = db('applications')
    .select('applications.*', 'application_types.name as type_name', 'application_types.code as type_code', 'users.full_name as applicant_name', 'users.email as applicant_email')
    .join('application_types', 'application_types.id', 'applications.application_type_id')
    .join('users', 'users.id', 'applications.applicant_id')
    .orderBy('applications.updated_at', 'desc');

  if (state) query = query.where('applications.current_state', state);
  if (workflow_id) query = query.where('applications.workflow_id', workflow_id);

  const [rows, [{ count }]] = await Promise.all([
    query.limit(limit).offset(offset),
    db('applications').modify(q => {
      if (state) q.where({ current_state: state });
      if (workflow_id) q.where({ workflow_id });
    }).count('id as count'),
  ]);
  return { rows, total: parseInt(count) };
}

async function transitionState(id, fromState, toState, version, reviewed_by, trx) {
  const q = (trx || db)('applications')
    .where({ id, current_state: fromState, version })
    .update({
      current_state: toState,
      version: db.raw('version + 1'),
      reviewed_by: reviewed_by || db.raw('reviewed_by'),
      updated_at: db.fn.now(),
    });

  if (toState === 'SUBMITTED') {
    q.update({
      current_state: toState,
      version: db.raw('version + 1'),
      updated_at: db.fn.now(),
      submitted_at: db.raw('COALESCE(submitted_at, now())'),
    });
  }

  const count = await q;
  return count;
}

async function incrementSubmissionCycle(id, trx) {
  return (trx || db)('applications').where({ id })
    .update({ current_submission_cycle: db.raw('current_submission_cycle + 1'), updated_at: db.fn.now() });
}

module.exports = { create, findById, findByIdWithDetails, findByApplicant, findByWorkflowRole, findAll, transitionState, incrementSubmissionCycle };