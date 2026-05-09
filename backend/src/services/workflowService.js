const workflowRepo = require("../repositories/workflowRepo");
const { ValidationError, NotFoundError } = require("../utils/errors");

async function getWorkflows(applicationTypeTd) {
  const workflows = applicationTypeTd
    ? await workflowRepo.findWorkflowsByTypeId(applicationTypeTd)
    : await workflowRepo.findAllWorkflows();
  return workflows;
}

async function createWorkflow(body) {
  return await workflowRepo.createWorkflow(body);
}

async function updateWorkflow(id, body) {
  const existing = await workflowRepo.findWorkflowById(id);
  if (!existing) throw new NotFoundError("Workflow");
  return await workflowRepo.updateWorkflow(id, body);
}

async function deleteWorkflow(id) {
  const existing = await workflowRepo.findWorkflowById(id);
  if (!existing) throw new NotFoundError("Workflow");
  await workflowRepo.deleteWorkflow(id);
  return true;
}

async function listWorkflowStates(workflowId) {
  const states = await workflowRepo.findWorkflowStates(workflowId);
  return states;
}

async function createWorkflowState(workflowId, body) {
  const workflow = await workflowRepo.findWorkflowById(workflowId);
  if (!workflow) throw new NotFoundError("Workflow");
  const state = await workflowRepo.createWorkflowState({
    ...body,
    workflow_id: workflowId,
  });
  return state;
}

async function updateWorkflowState(stateId, body) {
  const existing = await workflowRepo.findWorkflowStateById(stateId);
  if (!existing) throw new NotFoundError("WorkflowState");
  const state = await workflowRepo.updateWorkflowState(stateId, body);
  return state;
}

async function deleteWorkflowState(stateId) {
  const existing = await workflowRepo.findWorkflowStateById(stateId);
  if (!existing) throw new NotFoundError("WorkflowState");
  const state = await workflowRepo.updateWorkflowState(stateId, body);
  return state;
}

async function deleteWorkflowState(stateId) {
  const existing = await workflowRepo.findWorkflowStateById(stateId);
  if (!existing) throw new NotFoundError("WorkflowState");
  await workflowRepo.deleteWorkflowState(stateId);

  return true;
}

// Workflow Transitions

async function listWorkflowTransitions(workflowId) {
  const transitions = await workflowRepo.findAllTransitions(workflowId);
  return transitions;
}

async function createWorkflowTransition(workflowId, body) {
  const workflow = await workflowRepo.findWorkflowById(workflowId);
  if (!workflow) throw new NotFoundError("Workflow");
  const transition = await workflowRepo.createWorkflowTransition({
    ...body,
    workflow_id: workflowId,
  });
  return transition;
}

async function updateWorkflowTransition(transitionId, body) {
  const existing = await workflowRepo.findTransitionById(transitionId);
  if (!existing) throw new NotFoundError("WorkflowTransition");
  const transition = await workflowRepo.updateWorkflowTransition(
    transitionId,
    body,
  );
  return transition;
}

async function deleteWorkflowTransition(transitionId) {
  const existing = await workflowRepo.findTransitionById(transitionId);
  if (!existing) throw new NotFoundError("WorkflowTransition");
  await workflowRepo.deleteWorkflowTransition(transitionId);
  return true;
}

module.exports = {
  listWorkflowStates,
  createWorkflowState,
  updateWorkflowState,
  deleteWorkflowState,
  listWorkflowTransitions,
  createWorkflowTransition,
  updateWorkflowTransition,
  deleteWorkflowTransition,
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
