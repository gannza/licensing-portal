'use strict';

jest.mock('../../repositories/stageDecisionRepo');
jest.mock('../../repositories/applicationRepo');
jest.mock('../../services/stateMachineService');
jest.mock('../../services/auditService');

const { createDecision }   = require('../../services/stageDecisionService');
const stageDecisionRepo    = require('../../repositories/stageDecisionRepo');
const applicationService   = require('../../services/applicationService');
const applicationRepo      = require('../../repositories/applicationRepo');
const stateMachineService  = require('../../services/stateMachineService');
const auditService         = require('../../services/auditService');
const db                   = require('../../db/knex');
const { ValidationError, UnprocessableError } = require('../../utils/errors');

// ─── stageDecisionService.createDecision ─────────────────────────────────────

describe('stageDecisionService.createDecision', () => {
  const baseInput = {
    application_id:    'app-uuid',
    workflow_state_key: 'UNDER_REVIEW',
    reviewed_by:       'staff-uuid',
    decision_type:     'APPROVED_STAGE',
    decision_note:     'Looks good.',
    submission_cycle:  1,
  };

  const savedRow = { id: 'decision-uuid', ...baseInput };

  beforeEach(() => {
    stageDecisionRepo.create.mockResolvedValue(savedRow);
  });

  // ── decision_note validation ─────────────────────────────────────────────

  it('throws ValidationError for a null decision_note', async () => {
    await expect(createDecision({ ...baseInput, decision_note: null }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError for an empty-string decision_note', async () => {
    await expect(createDecision({ ...baseInput, decision_note: '' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError for a whitespace-only decision_note', async () => {
    await expect(createDecision({ ...baseInput, decision_note: '   ' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError for a tab-only decision_note', async () => {
    await expect(createDecision({ ...baseInput, decision_note: '\t\n ' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  // ── decision_type validation ──────────────────────────────────────────────

  it('throws ValidationError for an unrecognised decision_type', async () => {
    await expect(createDecision({ ...baseInput, decision_type: 'REJECTED' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError and names the accepted types', async () => {
    await expect(createDecision({ ...baseInput, decision_type: 'BAD_TYPE' }))
      .rejects.toThrow(/APPROVED_STAGE.*REQUEST_INFO.*ESCALATED/);
  });

  // ── valid insertions ──────────────────────────────────────────────────────

  it('calls repo.create and returns the record for APPROVED_STAGE', async () => {
    const result = await createDecision({ ...baseInput, decision_type: 'APPROVED_STAGE' });
    expect(stageDecisionRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toBe(savedRow);
  });

  it('calls repo.create and returns the record for REQUEST_INFO', async () => {
    await expect(createDecision({ ...baseInput, decision_type: 'REQUEST_INFO' }))
      .resolves.toBe(savedRow);
    expect(stageDecisionRepo.create).toHaveBeenCalledTimes(1);
  });

  it('calls repo.create and returns the record for ESCALATED', async () => {
    await expect(createDecision({ ...baseInput, decision_type: 'ESCALATED' }))
      .resolves.toBe(savedRow);
    expect(stageDecisionRepo.create).toHaveBeenCalledTimes(1);
  });

  it('trims the decision_note before persisting', async () => {
    await createDecision({ ...baseInput, decision_note: '  All clear.  ' });

    const [insertedData] = stageDecisionRepo.create.mock.calls[0];
    expect(insertedData.decision_note).toBe('All clear.');
  });

  it('passes the transaction argument through to the repo', async () => {
    const trx = Symbol('trx');
    await createDecision(baseInput, trx);

    expect(stageDecisionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ application_id: 'app-uuid' }),
      trx,
    );
  });

  it('generates a UUID id for the new record', async () => {
    await createDecision(baseInput);

    const [insertedData] = stageDecisionRepo.create.mock.calls[0];
    expect(typeof insertedData.id).toBe('string');
    expect(insertedData.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

// ─── Missing decision blocks transition (applicationService) ──────────────────

describe('applicationService.performTransition — decision note enforcement', () => {
  const baseApp = {
    id:                    'app-uuid',
    version:               3,
    current_state:         'UNDER_REVIEW',
    workflow_id:           'wf-uuid',
    applicant_id:          'applicant-uuid',
    reviewed_by:           'staff-uuid',
    application_type_id:   'type-uuid',
    current_submission_cycle: 1,
  };

  const actingStaff = { id: 'approver-uuid', system_role: 'STAFF' };

  beforeEach(() => {
    applicationRepo.findById.mockResolvedValue(baseApp);
    // Simulate a transition that requires a written decision
    stateMachineService.validateTransition.mockResolvedValue({ requires_decision: true });
    auditService.log.mockResolvedValue(undefined);
    db.raw.mockReturnValue('MOCK_RAW');
    db.fn = { now: jest.fn().mockReturnValue('MOCK_NOW') };
  });

  it('throws UnprocessableError when decision_note is absent and decision is required', async () => {
    await expect(
      applicationService.performTransition('app-uuid', { toState: 'APPROVED', decisionNote: undefined }, actingStaff),
    ).rejects.toBeInstanceOf(UnprocessableError);
  });

  it('throws UnprocessableError when decision_note is an empty string', async () => {
    await expect(
      applicationService.performTransition('app-uuid', { toState: 'APPROVED', decisionNote: '' }, actingStaff),
    ).rejects.toBeInstanceOf(UnprocessableError);
  });

  it('throws UnprocessableError when decision_note is whitespace only', async () => {
    await expect(
      applicationService.performTransition('app-uuid', { toState: 'APPROVED', decisionNote: '   ' }, actingStaff),
    ).rejects.toBeInstanceOf(UnprocessableError);
  });

  it('throws with a message indicating a decision note is required', async () => {
    await expect(
      applicationService.performTransition('app-uuid', { toState: 'APPROVED', decisionNote: null }, actingStaff),
    ).rejects.toThrow(/decision note is required/i);
  });

  it('does NOT throw when transition does not require a decision and note is absent', async () => {
    stateMachineService.validateTransition.mockResolvedValue({ requires_decision: false });

    // Supply a minimal transaction mock so the service can proceed past the validation
    const updatedApp = { ...baseApp, current_state: 'LEGAL_REVIEW', version: 4 };
    db.transaction.mockImplementation(async (cb) => {
      let idx = 0;
      const trxFn = jest.fn((table) => {
        if (table === 'applications') {
          idx++;
          if (idx === 1) return { where: jest.fn().mockReturnThis(), update: jest.fn().mockResolvedValue(1) };
          return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue(updatedApp) };
        }
        return { where: jest.fn().mockReturnThis() };
      });
      return cb(trxFn);
    });

    await expect(
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW', decisionNote: null }, actingStaff),
    ).resolves.toBeDefined();
  });
});
