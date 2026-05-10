const documentService = require("../services/documentService");

async function list(req, res, next) {
  try {
    const docs = await documentService.list(
      req.params.id,
      req.user.id,
      req.user.system_role,
      req.query.cycle,
    );
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
}

async function upload(req, res, next) {
  try {
    const doc = await documentService.upload(
      req.file,
      req.params.id,
      req.requirementKey,
      req.user.id,
      req.user.system_role,
    );

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}
async function getHistory(req, res, next) {
  try {
    const history = await documentService.getHistory(
      req.params.id,
      req.user.id,
      req.user.system_role,
      req.params.requirementKey,
    );
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, getHistory };
