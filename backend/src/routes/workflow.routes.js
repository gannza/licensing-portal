const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const {
  validateCreateWorkflow,
  validateUpdateWorkflow,
  validateCreateState,
  validateUpdateState,
  validateCreateTransition,
  validateUpdateTransition,
} = require("../dto");
const {
  getWorkflows,
  listWorkflowStates,
  deleteWorkflowState,
  createWorkflowState,
  updateWorkflowState,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  listWorkflowTransitions,
  createWorkflowTransition,
  updateWorkflowTransition,
  deleteWorkflowTransition,
} = require("../controllers/workflowController");

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

// Workflows
router.get("/workflows", getWorkflows);
router.post("/workflows", validateCreateWorkflow, createWorkflow);
router.patch("/workflows/:id", validateUpdateWorkflow, updateWorkflow);
router.delete("/workflows/:id", deleteWorkflow);

// Workflow States
router.get("/workflows/:id/states", listWorkflowStates);
router.post("/workflows/:id/states", validateCreateState, createWorkflowState);
router.patch("/workflow-states/:id", validateUpdateState, updateWorkflowState);
router.delete("/workflow-states/:id", deleteWorkflowState);

// Workflow Transitions
router.get("/workflows/:id/transitions", listWorkflowTransitions);
router.post(
  "/workflows/:id/transitions",
  validateCreateTransition,
  createWorkflowTransition,
);
router.patch(
  "/workflow-transitions/:id",
  validateUpdateTransition,
  updateWorkflowTransition,
);
router.delete("/workflow-transitions/:id", deleteWorkflowTransition);

// // Applications & Audit
// router.get("/applications", getApplications);

module.exports = router;
