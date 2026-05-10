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
  validateAddAssignment,
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
  listWorkflowAssignments,
  addWorkflowAssignment,
  removeWorkflowAssignment,
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
router.patch("/states/:id", validateUpdateState, updateWorkflowState);
router.delete("/states/:id", deleteWorkflowState);

// Workflow Transitions
router.get("/:id/transitions", listWorkflowTransitions);
router.post("/:id/transitions",
  validateCreateTransition,
  createWorkflowTransition,
);
router.patch(
  "/transitions/:id",
  validateUpdateTransition,
  updateWorkflowTransition,
);
router.delete("/transitions/:id", deleteWorkflowTransition);

// Workflow Assignments
router.get("/:id/assignments", listWorkflowAssignments);
router.post("/:id/assignments", validateAddAssignment, addWorkflowAssignment);
router.delete("/:id/assignments/:assignmentId", removeWorkflowAssignment);

module.exports = router;
