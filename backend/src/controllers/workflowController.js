const workflowService = require("../services/workflowService");
const userRepo = require("../repositories/userRepo");

// Workflows

async function getWorkflows(req, res, next) {
  try {
    const application_type_id = req.query.application_type_id || null;
    const workflows = await workflowService.getWorkflows(application_type_id);
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
    const state = await workflowService.createWorkflowState(req.body, req.params.id);
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
    const transition = await workflowService.createWorkflowTransition( req.params.id, req.body);
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

// Workflow Assignments

async function listWorkflowAssignments(req, res, next) {
  try {
    const assignments = await userRepo.getWorkflowAssignments(req.params.id);
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

async function addWorkflowAssignment(req, res, next) {
  try {
    const { user_id, role } = req.body;
    await userRepo.assignWorkflowRoles([{
      user_id,
      workflow_id: req.params.id,
      role,
      assigned_by: req.user.id,
      assigned_at: new Date(),
    }]);
    const assignments = await userRepo.getWorkflowAssignments(req.params.id);
    res.status(201).json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

async function removeWorkflowAssignment(req, res, next) {
  try {
    await userRepo.removeWorkflowAssignment(req.params.assignmentId);
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
  // Workflow Assignments
  listWorkflowAssignments,
  addWorkflowAssignment,
  removeWorkflowAssignment,
};
