const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  updateDocReq,
  removeDocReq,
} = require('../controllers/applicationTypesController');
const { validateUpdateDocRequirement } = require('../dto');

const router = express.Router();
router.use(authenticate, requireRole("ADMIN"));

router.patch('/:id', validateUpdateDocRequirement, updateDocReq);
router.delete('/:id', removeDocReq);

module.exports = router;
