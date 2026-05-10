const { v4: uuidv4 } = require('uuid');
const auditRepo = require('../repositories/auditRepo');

async function log({ application_id, acting_user_id, action, from_state, to_state, metadata }, trx) {
  return auditRepo.create({
    id: uuidv4(),
    application_id,
    acting_user_id,
    action,
    from_state,
    to_state,
    metadata: metadata ? JSON.stringify(metadata) : null,
  }, trx);
}

async function getAuditLogs(page = 1, limit = 50) {
  return auditRepo.findAll({ page, limit });
}

module.exports = { log, getAuditLogs };
