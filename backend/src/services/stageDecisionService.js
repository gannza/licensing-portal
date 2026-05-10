const { v4: uuidv4 } = require('uuid');
const stageDecisionRepo = require('../repositories/stageDecisionRepo');
const { ValidationError } = require('../utils/errors');

const VALID_DECISION_TYPES = ['APPROVED_STAGE', 'REQUEST_INFO'];

async function createDecision({ application_id, workflow_state_key, reviewed_by, decision_type, decision_note, submission_cycle }, trx) {
  if (!VALID_DECISION_TYPES.includes(decision_type)) {
    throw new ValidationError(`decision_type must be one of: ${VALID_DECISION_TYPES.join(', ')}`);
  }
  if (!decision_note || !decision_note.trim()) {
    throw new ValidationError('decision_note is required and cannot be empty or whitespace');
  }

  return stageDecisionRepo.create({
    id: uuidv4(),
    application_id,
    workflow_state_key,
    reviewed_by,
    decision_type,
    decision_note: decision_note.trim(),
    submission_cycle,
  }, trx);
}

module.exports = { createDecision };
