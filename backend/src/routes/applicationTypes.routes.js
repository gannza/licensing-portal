const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const {
  list,
  getOne,
  create,
  update,
  remove,
  createDocReq,
} = require("../controllers/applicationTypesController");
const {
  validateCreateDocRequirement,
  validateCreateApplicationType,
  validateUpdateApplicationType,
} = require("../dto");

const router = express.Router();
router.use(authenticate);

// Public (any authenticated user)
router.get("/", list);

// Admin
router.get("/:id", requireRole("ADMIN"), getOne);
router.post("/", requireRole("ADMIN"), validateCreateApplicationType, create);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validateUpdateApplicationType,
  update,
);
router.delete("/:id", requireRole("ADMIN"), remove);

// Document requirements
router.post(
  "/:typeId/document-requirements",
  requireRole("ADMIN"),
  validateCreateDocRequirement,
  createDocReq,
);

module.exports = router;
