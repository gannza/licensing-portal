const workflowRepo = require("../repositories/workflowRepo");
const { ValidationError, NotFoundError } = require("../utils/errors");

async function getWorkflows(applicationTypeId) {
  const workflows = applicationTypeId
    ? await workflowRepo.findWorkflowsByTypeId(applicationTypeId)
    : await workflowRepo.findAllWorkflows();
  return workflows;
}

async function createWorkflow(body) {
  const workflow = await workflowRepo.createWorkflow(body);

  const state = await workflowRepo.createWorkflowState({
    key: "DRAFT",
    label: "Draft",
    is_initial: true,
    is_terminal: false,
    display_order: 0,
    workflow_id: workflow.id,
  });

  const state2 = await workflowRepo.createWorkflowState({
    key: "SUBMITTED",
    label: "Submitted",
    is_initial: false,
    is_terminal: false,
    display_order: 1,
    workflow_id: workflow.id,
  });
  
    const state3 = await workflowRepo.createWorkflowState({
    key: "UNDER_REVIEW",
    label: "Under Review",
    is_initial: false,
    is_terminal: false,
    display_order: 2,
    workflow_id: workflow.id,
  });

   const state4 = await workflowRepo.createWorkflowState({
    key: "PENDING_INFORMATION",
    label: "Pending Information",
    is_initial: false,
    is_terminal: false,
    display_order: 3,
    workflow_id: workflow.id,
  });

  const state5 = await workflowRepo.createWorkflowState({
    key: "PENDING_APPROVAL",
    label: "Pending Approval",
    is_initial: false,
    is_terminal: false,
    display_order: 4,
    workflow_id: workflow.id,
  });

    const state6 = await workflowRepo.createWorkflowState({
    key: "APPROVED",
    label: "Approved",
    is_initial: false,
    is_terminal: true,
    is_approved: true,
    display_order: 5,
    workflow_id: workflow.id,
  });

   const state7 = await workflowRepo.createWorkflowState({
    key: "REJECTED",
    label: "Rejected",
    is_initial: false,
    is_terminal: true,
    is_approved: false,
    display_order: 6,
    workflow_id: workflow.id,
  });

  await workflowRepo.createWorkflowTransition({
    from_state_key: state.key,
    to_state_key: state2.key,
    required_role: "APPLICANT",
    requires_decision: false,
    label: "Submit Application",
    workflow_id: workflow.id,
  });

  return workflow;
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

async function createWorkflowState(body, workflowId) {
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
