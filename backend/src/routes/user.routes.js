const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const { validateCreateUser } = require("../dto");
const {
  listUsers,
  updateUserStatus,
  createUser,
  getUserWorkflowRoles,
} = require("../controllers/userController");

const router = express.Router();
router.use(authenticate, requireRole("ADMIN"));

// Users
router.post("/", validateCreateUser, createUser);
router.get("/", listUsers);
router.get("/workflow-roles/:id", getUserWorkflowRoles);
router.patch("/:id/status", updateUserStatus);

module.exports = router;
