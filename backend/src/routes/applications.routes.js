const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const {
  create,
  list,
  getById,
  stageDecision,
  getTimeline,
  getStageDecisions,
} = require("../controllers/applicationsController");
const {
  validateCreateApplication,
  validateCreateTransition,
} = require("../dto");

const router = express.Router();
router.use(authenticate);

router.post("/", requireRole("APPLICANT"), validateCreateApplication, create);
router.get("/", list);
router.get("/:id", getById);
router.post("/:id/stage-decision", validateCreateTransition, stageDecision);
router.get("/:id/timeline", getTimeline);
router.get("/:id/stage-decisions", getStageDecisions);

module.exports = router;
