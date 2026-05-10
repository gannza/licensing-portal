const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const { getAuditLogs } = require("../controllers/auditController");

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/logs", getAuditLogs);

module.exports = router;
