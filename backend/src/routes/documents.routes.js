const express = require('express');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  upload: uploadDocument,
  list,
  getHistory,
} = require('../controllers/documentsController');

const router = express.Router({ mergeParams: true });

router.post('/:requirement_key', authenticate, upload.single('file'), uploadDocument);
router.get('/', authenticate, list);
router.get('/:requirement_key/history', authenticate, getHistory);

module.exports = router;
