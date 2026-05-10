const db = require('../db/knex');

async function findWorkflowByTypeId(application_type_id) {
  return await db('workflows').where({ application_type_id }).first();
}

async function findTransitions(workflow_id, from_state_key) {
  return await db('workflow_transitions').where({ workflow_id, from_state_key });
}

async function findTransition(workflow_id, from_state_key, to_state_key) {
  return await db('workflow_transitions').where({ workflow_id, from_state_key, to_state_key }).first();
}

async function findState(workflow_id, key) {
  return await db('workflow_states').where({ workflow_id, key }).first();
}

async function findInitialState(workflow_id) {
  return await db('workflow_states').where({ workflow_id, is_initial: true }).first();
}

async function findUserWorkflowRoles(user_id, workflow_id) {
  return await db('user_workflow_roles').where({ user_id, workflow_id }).pluck('role');
}

async function findAllWorkflows() {
  return await db('workflows')
    .select('workflows.*', 'application_types.name as type_name', 'application_types.code as type_code')
    .join('application_types', 'application_types.id', 'workflows.application_type_id');
}



async function findWorkflowsByTypeId(application_type_id) {
  return await db('workflows')
    .where({ application_type_id })
    .select('workflows.*', 'application_types.name as type_name', 'application_types.code as type_code')
    .join('application_types', 'application_types.id', 'workflows.application_type_id')
    .orderBy('workflows.name');
}

async function findWorkflowById(id) {
  return await db('workflows').where({ id }).first();
}

async function createWorkflow(data) {
  const [row] = await db('workflows').insert(data).returning('*');
  return row;
}

async function updateWorkflow(id, data) {
  const [row] = await db('workflows').where({ id }).update(data).returning('*');
  return row;
}

async function deleteWorkflow(id) {
  await db('workflows').where({ id }).delete();
}

// Admin: Workflow States

async function findWorkflowStates(workflow_id) {
  return await db('workflow_states').where({ workflow_id }).orderBy('display_order');
}

async function findWorkflowStateById(id) {
  return await db('workflow_states').where({ id }).first();
}

async function createWorkflowState(data) {
  const [row] = await db('workflow_states').insert(data).returning('*');
  return row;
}

async function updateWorkflowState(id, data) {
  const [row] = await db('workflow_states').where({ id }).update(data).returning('*');
  return row;
}

async function deleteWorkflowState(id) {
  await db('workflow_states').where({ id }).delete();
}

async function findAllTransitions(workflow_id) {
  return await db('workflow_transitions')
    .where({ workflow_id })
    .orderBy(['from_state_key', 'to_state_key']);
}

async function findTransitionById(id) {
  return await db('workflow_transitions').where({ id }).first();
}

async function createWorkflowTransition(data) {
  const [row] = await db('workflow_transitions').insert(data).returning('*');
  return row;
}

async function updateWorkflowTransition(id, data) {
  const [row] = await db('workflow_transitions').where({ id }).update(data).returning('*');
  return row;
}

async function deleteWorkflowTransition(id) {
  await await db('workflow_transitions').where({ id }).delete();
}



module.exports = {
  // Existing
  findWorkflowByTypeId,
  findTransitions,
  findTransition,
  findState,
  findInitialState,
  findUserWorkflowRoles,
  findAllWorkflows,

  // Admin: workflows
  findWorkflowsByTypeId,
  findWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  // Admin: states
  findWorkflowStates,
  findWorkflowStateById,
  createWorkflowState,
  updateWorkflowState,
  deleteWorkflowState,
  // Admin: transitions
  findAllTransitions,
  findTransitionById,
  createWorkflowTransition,
  updateWorkflowTransition,
  deleteWorkflowTransition,
};
