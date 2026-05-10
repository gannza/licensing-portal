const workflowService = require("../services/workflowService");

// Workflows

async function getWorkflows(req, res, next) {
  try {
    const workflows = await workflowService.getWorkflows();
    res.json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
}

async function createWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
}

async function updateWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.updateWorkflow(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
}

async function deleteWorkflow(req, res, next) {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Workflow States

async function listWorkflowStates(req, res, next) {
  try {
    const states = await workflowService.listWorkflowStates(req.params.id);
    res.json({ success: true, data: states });
  } catch (err) {
    next(err);
  }
}

async function createWorkflowState(req, res, next) {
  try {
    const state = await workflowService.createWorkflowState({
      ...req.body,
      workflow_id: req.params.id,
    });
    res.status(201).json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
}

async function updateWorkflowState(req, res, next) {
  try {
    const state = await workflowService.updateWorkflowState(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
}

async function deleteWorkflowState(req, res, next) {
  try {
    await workflowService.deleteWorkflowState(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Workflow Transitions

async function listWorkflowTransitions(req, res, next) {
  try {
    const transitions = await workflowService.listWorkflowTransitions(
      req.params.id,
    );
    res.json({ success: true, data: transitions });
  } catch (err) {
    next(err);
  }
}

async function createWorkflowTransition(req, res, next) {
  try {
    const transition = await workflowService.createWorkflowTransition({
      ...req.body,
      workflow_id: req.params.id,
    });
    res.status(201).json({ success: true, data: transition });
  } catch (err) {
    next(err);
  }
}

async function updateWorkflowTransition(req, res, next) {
  try {
    const transition = await workflowService.updateWorkflowTransition(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: transition });
  } catch (err) {
    next(err);
  }
}

async function deleteWorkflowTransition(req, res, next) {
  try {
    await workflowService.deleteWorkflowTransition(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Workflows
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  // Workflow States
  listWorkflowStates,
  createWorkflowState,
  updateWorkflowState,
  deleteWorkflowState,
  // Workflow Transitions
  listWorkflowTransitions,
  createWorkflowTransition,
  updateWorkflowTransition,
  deleteWorkflowTransition,
};
