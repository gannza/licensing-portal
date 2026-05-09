const adminService = require("../services/adminService");
const workflowService = require("../services/workflowService");
const applicationService = require("../services/applicationService");

const { ValidationError, NotFoundError } = require("../utils/errors");

// Users

async function createUser(req, res, next) {
  try {
    const result = await adminService.createStaffUser(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await adminService.listUsers(page, limit);
    res.json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
}

async function getUserWorkflowRoles(req, res, next) {
  try {
    const user = await adminService.getUserWorkflowRoles(req.params.id);
    if (!user) throw new NotFoundError("User");
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== "boolean")
      throw new ValidationError("is_active must be a boolean");
    const updated = await adminService.updateUserStatus(
      req.params.id,
      is_active,
      req.user.id,
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

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
    validate(createWorkflowSchema, req.body);
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
}

async function updateWorkflow(req, res, next) {
  try {
   
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
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
    const transitions = await workflowService.listWorkflowTransitions(req.params.id);
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
    const existing = await workflowService.findWorkflowTransitionById(req.params.id);
    if (!existing) throw new NotFoundError("WorkflowTransition");
    await workflowService.deleteWorkflowTransition(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Applications & Audit

async function getApplications(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await applicationService.getAllApplications(page, limit, req.query.state, req.query.workflow_id);
    res.json({
      success: true,
     result
    });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await auditRepo.findAll({ page, limit });
    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total: result.total },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Users
  createUser,
  listUsers,
  getUserWorkflowRoles,
  updateUserStatus,
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
  // Apps & Audit
  getApplications,
  getAuditLogs,
};
