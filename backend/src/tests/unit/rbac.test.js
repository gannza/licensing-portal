'use strict';

// workflowRepo must be mocked before stateMachineService is required.
jest.mock('../../repositories/workflowRepo');

const { requireRole }             = require('../../middleware/rbac');
const { validateTransition }      = require('../../services/stateMachineService');
const workflowRepo                = require('../../repositories/workflowRepo');
const { ForbiddenError }          = require('../../utils/errors');

// ─── requireRole middleware ───────────────────────────────────────────────────

describe('requireRole middleware — system role enforcement', () => {
  let res, next;

  beforeEach(() => {
    res  = {};
    next = jest.fn();
  });

  // ── no user ────────────────────────────────────────────────────────────────

  it('passes ForbiddenError to next() when req.user is absent', () => {
    const req = {};
    requireRole('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  // ── ADMIN routes ───────────────────────────────────────────────────────────

  it('calls next() with no args for ADMIN user on an ADMIN route', () => {
    const req = { user: { system_role: 'ADMIN' } };
    requireRole('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledWith(/* nothing */);
  });

  it('denies APPLICANT on an ADMIN-only route', () => {
    const req = { user: { system_role: 'APPLICANT' } };
    requireRole('ADMIN')(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('denies STAFF on an ADMIN-only route', () => {
    const req = { user: { system_role: 'STAFF' } };
    requireRole('ADMIN')(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  // ── APPLICANT routes ───────────────────────────────────────────────────────

  it('allows APPLICANT on an APPLICANT-only route', () => {
    const req = { user: { system_role: 'APPLICANT' } };
    requireRole('APPLICANT')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('denies STAFF on an APPLICANT-only route', () => {
    const req = { user: { system_role: 'STAFF' } };
    requireRole('APPLICANT')(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('denies ADMIN on an APPLICANT-only route', () => {
    const req = { user: { system_role: 'ADMIN' } };
    requireRole('APPLICANT')(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  // ── STAFF routes ───────────────────────────────────────────────────────────

  it('allows STAFF on a STAFF-only route', () => {
    const req = { user: { system_role: 'STAFF' } };
    requireRole('STAFF')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  // ── Multi-role routes ──────────────────────────────────────────────────────

  it('allows ADMIN on a route that accepts ADMIN or STAFF', () => {
    const req = { user: { system_role: 'ADMIN' } };
    requireRole('STAFF', 'ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('allows STAFF on a route that accepts ADMIN or STAFF', () => {
    const req = { user: { system_role: 'STAFF' } };
    requireRole('STAFF', 'ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('denies APPLICANT on a route that accepts ADMIN or STAFF', () => {
    const req = { user: { system_role: 'APPLICANT' } };
    requireRole('STAFF', 'ADMIN')(req, res, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  // ── Error message content ──────────────────────────────────────────────────

  it('includes the allowed roles in the ForbiddenError message', () => {
    const req = { user: { system_role: 'APPLICANT' } };
    requireRole('STAFF', 'ADMIN')(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/STAFF/);
    expect(err.message).toMatch(/ADMIN/);
  });
});

// ─── Workflow role enforcement (via stateMachineService) ─────────────────────
//
// Tests that each workflow role can only trigger the transitions it is
// authorised for, and that cross-role attempts are denied.

describe('Workflow role enforcement via stateMachineService', () => {
  const WF_ID = 'wf-uuid';

  const mkApp = (overrides = {}) => ({
    workflow_id:   WF_ID,
    applicant_id:  'applicant-uuid',
    current_state: 'SUBMITTED',
    reviewed_by:   null,
    ...overrides,
  });

  const staffWith = (role) => ({ id: `${role}-user`, system_role: 'STAFF' });

  function mockCurrentState(isTerminal = false) {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: isTerminal });
  }

  function mockToState(isTerminal = false) {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: isTerminal });
  }

  function mockTransition(requiredRole, toState = 'NEXT') {
    workflowRepo.findTransition.mockResolvedValueOnce({ required_role: requiredRole, to_state_key: toState });
  }

  function mockWorkflowRoles(roles) {
    workflowRepo.findUserWorkflowRoles.mockResolvedValueOnce(roles);
  }

  // ── INTAKE_OFFICER ─────────────────────────────────────────────────────────

  it('INTAKE_OFFICER can perform a transition requiring INTAKE_OFFICER role', async () => {
    mockCurrentState();
    mockTransition('INTAKE_OFFICER', 'UNDER_REVIEW');
    mockWorkflowRoles(['INTAKE_OFFICER']);
    mockToState();

    await expect(
      validateTransition(mkApp(), 'UNDER_REVIEW', staffWith('INTAKE_OFFICER')),
    ).resolves.toBeDefined();
  });

  it('INTAKE_OFFICER is denied a transition requiring REVIEWER role', async () => {
    mockCurrentState();
    mockTransition('REVIEWER', 'LEGAL_REVIEW');
    mockWorkflowRoles(['INTAKE_OFFICER']); // only has INTAKE_OFFICER

    await expect(
      validateTransition(mkApp({ current_state: 'UNDER_REVIEW' }), 'LEGAL_REVIEW', staffWith('INTAKE_OFFICER')),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  // ── REVIEWER ───────────────────────────────────────────────────────────────

  it('REVIEWER can move an application to the legal-review stage', async () => {
    mockCurrentState();
    mockTransition('REVIEWER', 'LEGAL_REVIEW');
    mockWorkflowRoles(['REVIEWER']);
    mockToState();

    await expect(
      validateTransition(mkApp({ current_state: 'UNDER_REVIEW' }), 'LEGAL_REVIEW', staffWith('REVIEWER')),
    ).resolves.toBeDefined();
  });

  it('REVIEWER is denied a transition requiring APPROVER role', async () => {
    mockCurrentState();
    mockTransition('APPROVER', 'APPROVED');
    mockWorkflowRoles(['REVIEWER']); // only REVIEWER, not APPROVER

    await expect(
      validateTransition(mkApp({ current_state: 'FINAL_REVIEW' }), 'APPROVED', staffWith('REVIEWER')),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  // ── LEGAL_OFFICER ──────────────────────────────────────────────────────────

  it('LEGAL_OFFICER can move an application through legal review', async () => {
    mockCurrentState();
    mockTransition('LEGAL_OFFICER', 'FINANCIAL_REVIEW');
    mockWorkflowRoles(['LEGAL_OFFICER']);
    mockToState();

    await expect(
      validateTransition(mkApp({ current_state: 'LEGAL_REVIEW' }), 'FINANCIAL_REVIEW', staffWith('LEGAL_OFFICER')),
    ).resolves.toBeDefined();
  });

  it('LEGAL_OFFICER is denied a transition requiring FINANCIAL_OFFICER role', async () => {
    mockCurrentState();
    mockTransition('FINANCIAL_OFFICER', 'FINAL_REVIEW');
    mockWorkflowRoles(['LEGAL_OFFICER']);

    await expect(
      validateTransition(mkApp({ current_state: 'FINANCIAL_REVIEW' }), 'FINAL_REVIEW', staffWith('LEGAL_OFFICER')),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  // ── APPROVER ───────────────────────────────────────────────────────────────

  it('APPROVER can approve an application they did not review', async () => {
    const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: 'someone-else-uuid' });
    const approverUser = { id: 'approver-uuid', system_role: 'STAFF' };

    mockCurrentState();
    mockTransition('APPROVER', 'APPROVED');
    mockWorkflowRoles(['APPROVER']);
    mockToState(true); // APPROVED is terminal

    await expect(validateTransition(app, 'APPROVED', approverUser)).resolves.toBeDefined();
  });

  it('APPROVER is blocked from approving an application they personally reviewed', async () => {
    // reviewed_by matches the approver's id → reviewer-cannot-approve rule
    const approverUser = { id: 'approver-uuid', system_role: 'STAFF' };
    const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: 'approver-uuid' });

    mockCurrentState();
    mockTransition('APPROVER', 'APPROVED');
    mockWorkflowRoles(['APPROVER']);
    mockToState(true);

    await expect(validateTransition(app, 'APPROVED', approverUser))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  // ── Cross-role denial ──────────────────────────────────────────────────────

  it('staff with no workflow roles is denied every transition', async () => {
    mockCurrentState();
    mockTransition('INTAKE_OFFICER', 'UNDER_REVIEW');
    mockWorkflowRoles([]); // zero roles assigned

    await expect(
      validateTransition(mkApp(), 'UNDER_REVIEW', staffWith('NONE')),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('APPLICANT is always denied staff-role transitions', async () => {
    const applicantUser = { id: 'applicant-uuid', system_role: 'APPLICANT' };
    mockCurrentState();
    mockTransition('INTAKE_OFFICER', 'UNDER_REVIEW');

    await expect(
      validateTransition(mkApp(), 'UNDER_REVIEW', applicantUser),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
