'use strict';

jest.mock('../../repositories/workflowRepo');

const { validateTransition, getAvailableTransitions } = require('../../services/stateMachineService');
const workflowRepo = require('../../repositories/workflowRepo');
const { ForbiddenError, UnprocessableError } = require('../../utils/errors');

// ─── Fixtures ────────────────────────────────────────────────────────────────

const WF_ID = 'wf-uuid';

const mkApp = (overrides = {}) => ({
  workflow_id: WF_ID,
  applicant_id: 'applicant-uuid',
  current_state: 'DRAFT',
  reviewed_by: null,
  ...overrides,
});

const applicant = { id: 'applicant-uuid', system_role: 'APPLICANT' };
const staff     = { id: 'staff-uuid',     system_role: 'STAFF' };
const approver  = { id: 'approver-uuid',  system_role: 'STAFF' };

// Shorthand helpers to set up workflowRepo mocks for a single validateTransition call.
// validateTransition calls findState twice: once for current state, once for toState.
function mockCurrentState(isTerminal) {
  workflowRepo.findState.mockResolvedValueOnce({ is_terminal: isTerminal });
}

function mockToState(isTerminal) {
  workflowRepo.findState.mockResolvedValueOnce({ is_terminal: isTerminal });
}

function mockTransition(transition) {
  workflowRepo.findTransition.mockResolvedValueOnce(transition);
}

function mockWorkflowRoles(roles) {
  workflowRepo.findUserWorkflowRoles.mockResolvedValueOnce(roles);
}

// ─── validateTransition ───────────────────────────────────────────────────────

describe('stateMachineService.validateTransition', () => {
  // ── Valid transitions ──────────────────────────────────────────────────────

  describe('valid transitions', () => {
    it('succeeds when an applicant submits their own draft', async () => {
      mockCurrentState(false);
      mockTransition({ from_state_key: 'DRAFT', to_state_key: 'SUBMITTED', required_role: 'APPLICANT' });
      mockToState(false);

      const result = await validateTransition(mkApp(), 'SUBMITTED', applicant);
      expect(result).toMatchObject({ to_state_key: 'SUBMITTED' });
    });

    it('succeeds when staff with the correct workflow role performs a transition', async () => {
      const app = mkApp({ current_state: 'SUBMITTED', reviewed_by: null });
      mockCurrentState(false);
      mockTransition({ required_role: 'INTAKE_OFFICER' });
      mockWorkflowRoles(['INTAKE_OFFICER']);
      mockToState(false);

      await expect(validateTransition(app, 'UNDER_REVIEW', staff)).resolves.toBeDefined();
    });

    it('allows a different staff member (non-reviewer) to approve', async () => {
      // reviewed_by is staff-uuid; approver-uuid is a different person
      const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: 'staff-uuid' });
      mockCurrentState(false);
      mockTransition({ required_role: 'APPROVER' });
      mockWorkflowRoles(['APPROVER']);
      mockToState(true); // APPROVED is terminal

      await expect(validateTransition(app, 'APPROVED', approver)).resolves.toBeDefined();
    });
  });

  // ── Invalid / missing transitions ──────────────────────────────────────────

  describe('invalid transitions', () => {
    it('throws UnprocessableError when no transition exists between those states', async () => {
      mockCurrentState(false);
      workflowRepo.findTransition.mockResolvedValueOnce(null);

      await expect(validateTransition(mkApp(), 'APPROVED', applicant))
        .rejects.toBeInstanceOf(UnprocessableError);
    });

    it('throws UnprocessableError with a descriptive message', async () => {
      mockCurrentState(false);
      workflowRepo.findTransition.mockResolvedValueOnce(null);

      await expect(validateTransition(mkApp({ current_state: 'DRAFT' }), 'APPROVED', applicant))
        .rejects.toThrow(/No valid transition from DRAFT to APPROVED/);
    });
  });

  // ── Terminal state blocks further transitions ──────────────────────────────

  describe('terminal state enforcement', () => {
    it('throws UnprocessableError when application is already in a terminal state', async () => {
      mockCurrentState(true); // current state is terminal

      await expect(validateTransition(mkApp({ current_state: 'APPROVED' }), 'ANYTHING', applicant))
        .rejects.toBeInstanceOf(UnprocessableError);
    });

    it('throws with the terminal-state message', async () => {
      mockCurrentState(true);

      await expect(validateTransition(mkApp({ current_state: 'REJECTED' }), 'DRAFT', applicant))
        .rejects.toThrow(/terminal state/);
    });

    it('does NOT block a non-terminal state', async () => {
      mockCurrentState(false);
      workflowRepo.findTransition.mockResolvedValueOnce(null); // no path, but no terminal error

      // Should throw UnprocessableError for missing transition, not terminal
      await expect(validateTransition(mkApp(), 'NOWHERE', applicant))
        .rejects.toThrow(/No valid transition/);
    });
  });

  // ── Role enforcement ───────────────────────────────────────────────────────

  describe('role enforcement', () => {
    it('throws ForbiddenError when an applicant tries a staff-only transition', async () => {
      mockCurrentState(false);
      mockTransition({ required_role: 'INTAKE_OFFICER' });

      await expect(validateTransition(mkApp(), 'UNDER_REVIEW', applicant))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ForbiddenError when staff tries an applicant-only transition', async () => {
      mockCurrentState(false);
      mockTransition({ required_role: 'APPLICANT' });

      await expect(validateTransition(mkApp(), 'SUBMITTED', staff))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ForbiddenError when a different applicant tries to submit', async () => {
      mockCurrentState(false);
      mockTransition({ required_role: 'APPLICANT' });

      const otherApplicant = { id: 'other-applicant-uuid', system_role: 'APPLICANT' };
      await expect(validateTransition(mkApp(), 'SUBMITTED', otherApplicant))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ForbiddenError when staff lacks the required workflow role', async () => {
      mockCurrentState(false);
      mockTransition({ required_role: 'LEGAL_OFFICER' });
      mockWorkflowRoles(['INTAKE_OFFICER']); // has intake role, not legal

      await expect(validateTransition(mkApp({ current_state: 'UNDER_REVIEW' }), 'LEGAL_REVIEW', staff))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ForbiddenError with the required-role message', async () => {
      mockCurrentState(false);
      mockTransition({ required_role: 'FINANCIAL_OFFICER' });
      mockWorkflowRoles([]);

      await expect(validateTransition(mkApp(), 'FINANCIAL_REVIEW', staff))
        .rejects.toThrow(/FINANCIAL_OFFICER/);
    });
  });

  // ── Reviewer-cannot-approve rule ───────────────────────────────────────────

  describe('reviewer-cannot-approve rule', () => {
    it('throws ForbiddenError when the reviewer tries to approve (terminal destination)', async () => {
      // staff-uuid is the reviewer; they also have APPROVER role
      const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: staff.id });
      mockCurrentState(false);
      mockTransition({ required_role: 'APPROVER' });
      mockWorkflowRoles(['APPROVER']);
      mockToState(true); // destination is terminal (APPROVED)

      await expect(validateTransition(app, 'APPROVED', staff))
        .rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws with the reviewer-cannot-approve message', async () => {
      const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: staff.id });
      mockCurrentState(false);
      mockTransition({ required_role: 'APPROVER' });
      mockWorkflowRoles(['APPROVER']);
      mockToState(true);

      await expect(validateTransition(app, 'APPROVED', staff))
        .rejects.toThrow(/reviewer.*cannot be its approver/i);
    });

    it('does NOT block the reviewer from non-terminal transitions', async () => {
      // reviewer moving to a non-terminal state is fine
      const app = mkApp({ current_state: 'UNDER_REVIEW', reviewed_by: staff.id });
      mockCurrentState(false);
      mockTransition({ required_role: 'REVIEWER' });
      mockWorkflowRoles(['REVIEWER']);
      mockToState(false); // destination is NOT terminal

      await expect(validateTransition(app, 'LEGAL_REVIEW', staff)).resolves.toBeDefined();
    });

    it('does NOT block staff who is not the reviewer from approving', async () => {
      const app = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: 'someone-else-uuid' });
      mockCurrentState(false);
      mockTransition({ required_role: 'APPROVER' });
      mockWorkflowRoles(['APPROVER']);
      mockToState(true);

      await expect(validateTransition(app, 'APPROVED', approver)).resolves.toBeDefined();
    });
  });
});

// ─── getAvailableTransitions ──────────────────────────────────────────────────

describe('stateMachineService.getAvailableTransitions', () => {
  it('returns an empty array when the application is in a terminal state', async () => {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: true });

    const result = await getAvailableTransitions(mkApp({ current_state: 'APPROVED' }), applicant);
    expect(result).toEqual([]);
  });

  it('returns only the transitions the acting user may take', async () => {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: false }); // current state

    // Two transitions available: one for APPLICANT, one for INTAKE_OFFICER
    workflowRepo.findTransitions.mockResolvedValueOnce([
      { to_state_key: 'SUBMITTED',   required_role: 'APPLICANT' },
      { to_state_key: 'UNDER_REVIEW', required_role: 'INTAKE_OFFICER' },
    ]);

    const result = await getAvailableTransitions(mkApp(), applicant);

    expect(result).toHaveLength(1);
    expect(result[0].to_state_key).toBe('SUBMITTED');
  });

  it('returns staff transitions filtered by workflow role', async () => {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: false }); // current state check

    workflowRepo.findTransitions.mockResolvedValueOnce([
      { to_state_key: 'LEGAL_REVIEW',     required_role: 'REVIEWER' },
      { to_state_key: 'FINANCIAL_REVIEW', required_role: 'FINANCIAL_OFFICER' },
    ]);

    // staff has REVIEWER role but not FINANCIAL_OFFICER
    workflowRepo.findUserWorkflowRoles.mockResolvedValue(['REVIEWER']);
    workflowRepo.findState.mockResolvedValue({ is_terminal: false }); // to-state checks

    const result = await getAvailableTransitions(mkApp({ current_state: 'UNDER_REVIEW' }), staff);

    expect(result).toHaveLength(1);
    expect(result[0].to_state_key).toBe('LEGAL_REVIEW');
  });

  it('excludes the terminal approve transition for the reviewer', async () => {
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: false }); // current state

    workflowRepo.findTransitions.mockResolvedValueOnce([
      { to_state_key: 'APPROVED', required_role: 'APPROVER' },
    ]);

    workflowRepo.findUserWorkflowRoles.mockResolvedValueOnce(['APPROVER']);
    // APPROVED is terminal and reviewed_by === actingUser.id
    workflowRepo.findState.mockResolvedValueOnce({ is_terminal: true });

    const reviewerApp = mkApp({ current_state: 'FINAL_REVIEW', reviewed_by: staff.id });
    const result = await getAvailableTransitions(reviewerApp, staff);

    expect(result).toHaveLength(0);
  });
});
