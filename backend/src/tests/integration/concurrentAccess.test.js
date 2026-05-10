'use strict';
/**
 * Concurrent Access — Optimistic Locking Tests
 *
 * The application prevents lost-update races via an optimistic lock on the
 * `version` column.  applicationService.performTransition does:
 *
 *   UPDATE applications SET ..., version = version + 1
 *   WHERE id = ? AND version = ?        ← only matches if nobody else changed it
 *
 * If 0 rows are updated, a ConflictError (HTTP 409) is thrown so the caller
 * can retry with a fresh read.  These tests prove that contract.
 */

jest.mock('../../repositories/applicationRepo');
jest.mock('../../repositories/workflowRepo');
jest.mock('../../repositories/documentRepo');
jest.mock('../../services/stateMachineService');
jest.mock('../../services/auditService');
jest.mock('../../services/stageDecisionService');

const applicationService  = require('../../services/applicationService');
const applicationRepo     = require('../../repositories/applicationRepo');
const stateMachineService = require('../../services/stateMachineService');
const auditService        = require('../../services/auditService');
const db                  = require('../../db/knex');
const { ConflictError }   = require('../../utils/errors');

const baseApplication = {
  id:                       'app-uuid',
  version:                  5,
  current_state:            'UNDER_REVIEW',
  workflow_id:              'wf-uuid',
  applicant_id:             'applicant-uuid',
  reviewed_by:              'reviewer-uuid',
  application_type_id:      'type-uuid',
  current_submission_cycle: 1,
};

const actingStaff = { id: 'staff-uuid', system_role: 'STAFF' };

/**
 * Rows matched by the optimistic-lock WHERE clause
 * 0 simulates a concurrent write that already won.
 */
function setupTransaction(rowsUpdated) {
  const updatedApp = { ...baseApplication, current_state: 'LEGAL_REVIEW', version: baseApplication.version + 1 };

  db.transaction.mockImplementation(async (cb) => {
    let applicationsCallIdx = 0;

    const trxFn = jest.fn((table) => {
      if (table === 'applications') {
        const callIdx = applicationsCallIdx++;
        if (callIdx === 0) {
          // First call: the optimistic-lock UPDATE
          return {
            where:  jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(rowsUpdated),
          };
        }
        // Subsequent calls: SELECT the updated row
        return {
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(updatedApp),
        };
      }
      // Any other table (audit, etc.)
      return { where: jest.fn().mockReturnThis() };
    });

    return cb(trxFn);
  });

  db.raw = jest.fn().mockReturnValue('MOCK_RAW');
  db.fn  = { now: jest.fn().mockReturnValue('MOCK_NOW') };
}

// Tests

beforeEach(() => {
  applicationRepo.findById.mockResolvedValue(baseApplication);
  stateMachineService.validateTransition.mockResolvedValue({ requires_decision: false });
  auditService.log.mockResolvedValue(undefined);
});

describe('Optimistic locking - single-writer scenarios', () => {
  it('succeeds and returns the updated application when the version matches', async () => {
    setupTransaction(1); // 1 row updated -> lock won

    const result = await applicationService.performTransition(
      'app-uuid',
      { toState: 'LEGAL_REVIEW', decisionNote: null },
      actingStaff,
    );

    expect(result).toBeDefined();
    expect(result.application).toBeDefined();
    expect(result.stage_decision).toBeNull();
  });

  it('throws ConflictError (409) when the version no longer matches', async () => {
    setupTransaction(0); // 0 rows updated -> another writer already advanced the version

    await expect(
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('ConflictError carries statusCode 409', async () => {
    setupTransaction(0);

    await expect(
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('does NOT call the audit log when the lock fails', async () => {
    setupTransaction(0);

    await applicationService
      .performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff)
      .catch(() => {});

    expect(auditService.log).not.toHaveBeenCalled();
  });
});

describe('Optimistic locking - concurrent-writer scenario', () => {
  /**
   * This test explicitly demonstrates the concurrent-access requirement:
   *
   *   1. Two requests read the same application (version = 5).
   *   2. Both enter the DB transaction "simultaneously" and attempt the same transition.
   *   3. The first transaction's UPDATE matches version=5 -> succeeds.
   *   4. The second transaction's UPDATE finds version=6 already set -> 0 rows
   *      -> ConflictError is thrown, protecting data integrity.
   */
  it('exactly one of two concurrent writers succeeds; the other gets ConflictError', async () => {
    let transactionInvocationCount = 0;
    const updatedApp = { ...baseApplication, current_state: 'LEGAL_REVIEW', version: 6 };

    db.transaction.mockImplementation(async (cb) => {
      transactionInvocationCount++;

      // First invocation wins the lock (rowsUpdated = 1).
      // Second invocation finds the version already advanced (rowsUpdated = 0).
      const rowsForThisCall = transactionInvocationCount === 1 ? 1 : 0;

      let appCallIdx = 0;
      const trxFn = jest.fn((table) => {
        if (table === 'applications') {
          const idx = appCallIdx++;
          if (idx === 0) {
            return {
              where:  jest.fn().mockReturnThis(),
              update: jest.fn().mockResolvedValue(rowsForThisCall),
            };
          }
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(updatedApp),
          };
        }
        return { where: jest.fn().mockReturnThis() };
      });

      return cb(trxFn);
    });

    db.raw = jest.fn().mockReturnValue('MOCK_RAW');
    db.fn  = { now: jest.fn().mockReturnValue('MOCK_NOW') };

    // Both requests read version=5 from applicationRepo.
    applicationRepo.findById.mockResolvedValue(baseApplication);

    // Launch both transitions concurrently on the event loop.
    const [r1, r2] = await Promise.allSettled([
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
    ]);

    const successes = [r1, r2].filter((r) => r.status === 'fulfilled');
    const failures  = [r1, r2].filter((r) => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toBeInstanceOf(ConflictError);
    expect(failures[0].reason).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('the winning writer returns a valid result with the advanced version', async () => {
    let count = 0;
    const updatedApp = { ...baseApplication, current_state: 'LEGAL_REVIEW', version: 6 };

    db.transaction.mockImplementation(async (cb) => {
      count++;
      const rows = count === 1 ? 1 : 0;
      let idx = 0;
      const trxFn = jest.fn((table) => {
        if (table === 'applications') {
          const i = idx++;
          if (i === 0) return { where: jest.fn().mockReturnThis(), update: jest.fn().mockResolvedValue(rows) };
          return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue(updatedApp) };
        }
        return { where: jest.fn().mockReturnThis() };
      });
      return cb(trxFn);
    });

    db.raw = jest.fn().mockReturnValue('MOCK_RAW');
    db.fn  = { now: jest.fn().mockReturnValue('MOCK_NOW') };

    const [r1, r2] = await Promise.allSettled([
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
      applicationService.performTransition('app-uuid', { toState: 'LEGAL_REVIEW' }, actingStaff),
    ]);

    const winner = [r1, r2].find((r) => r.status === 'fulfilled');
    expect(winner.value.application).toMatchObject({
      current_state: 'LEGAL_REVIEW',
      version:       6,
    });
  });
});
