const auditService = require('../services/auditService');

async function getAuditLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await auditService.getAuditLogs(page, limit);
    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total: result.total },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAuditLogs,
};
