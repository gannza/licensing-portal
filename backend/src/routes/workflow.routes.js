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
router.get("/", getWorkflows);
router.post("/", validateCreateWorkflow, createWorkflow);
router.patch("/:id", validateUpdateWorkflow, updateWorkflow);
router.delete("/:id", deleteWorkflow);

// Workflow States
router.get("/:id/states", listWorkflowStates);
router.post("/:id/states", validateCreateState, createWorkflowState);
router.patch("/workflow-states/:id", validateUpdateState, updateWorkflowState);
router.delete("/workflow-states/:id", deleteWorkflowState);

// Workflow Transitions
router.get("/:id/transitions", listWorkflowTransitions);
router.post("/:id/transitions",
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
