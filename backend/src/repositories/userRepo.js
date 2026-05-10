const db = require('../db/knex');

async function findByEmail(email) {
  return await db('users').where({ email: email.toLowerCase() }).first();
}

async function findById(id) {
  return await db('users').where({ id }).first();
}

async function create(data, trx) {
  const db_ref = trx || db;
  const [row] = await db_ref('users').insert({ ...data, email: data.email.toLowerCase() }).returning('*');
  return row;
}

async function assignWorkflowRoles(roleRows, trx) {
  const db_ref = trx || db;
  await db_ref('user_workflow_roles')
    .insert(roleRows)
    .onConflict(['user_id', 'workflow_id', 'role'])
    .ignore();
}

async function updateLastLogin(id) {
  return await db('users').where({ id }).update({ last_login_at: db.fn.now(), updated_at: db.fn.now() });
}

async function updatePassword(id, password_hash) {
  return await db('users').where({ id }).update({ password_hash, must_change_password: false, updated_at: db.fn.now() });
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

async function getUserWorkflowRoles(id) {

    const user = await findById(id);
    if (!user) return null;
    const { password_hash, ...safe } = user;
    const roles = await db('user_workflow_roles')
      .where({ user_id: id })
      .join('workflows', 'user_workflow_roles.workflow_id', 'workflows.id')
      .select('user_workflow_roles.*', 'workflows.name as workflow_name');
    return { ...safe, workflow_roles: roles };

}
async function getUserRoles(user_id) {
   const userRoles = await db('user_workflow_roles').where({ user_id: user_id }).select('workflow_id', 'role');
    return userRoles;
}
  

async function getWorkflowAssignments(workflow_id) {
  return await db('user_workflow_roles')
    .where('user_workflow_roles.workflow_id', workflow_id)
    .join('users', 'user_workflow_roles.user_id', 'users.id')
    .select(
      'user_workflow_roles.id',
      'user_workflow_roles.user_id',
      'user_workflow_roles.workflow_id',
      'user_workflow_roles.role',
      'user_workflow_roles.assigned_at',
      'users.full_name',
      'users.email',
    )
    .orderBy('users.full_name');
}

async function removeWorkflowAssignment(id) {
  await db('user_workflow_roles').where({ id }).delete();
}

module.exports = { findByEmail, findById, create, updateLastLogin, updatePassword, findAll, updateStatus, getUserWorkflowRoles, getUserRoles, assignWorkflowRoles, getWorkflowAssignments, removeWorkflowAssignment };