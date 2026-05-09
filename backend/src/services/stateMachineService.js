const workflowRepo = require('../repositories/workflowRepo');
const applicationRepo = require('../repositories/applicationRepo');
const { ForbiddenError, UnprocessableError, NotFoundError } = require('../utils/errors');

async function validateTransition(application, toState, actingUser) {
  const currentStateRecord = await workflowRepo.findState(application.workflow_id, application.current_state);
  if (currentStateRecord && currentStateRecord.is_terminal) {
    throw new UnprocessableError('Application is in a terminal state and cannot be transitioned');
  }

  const transition = await workflowRepo.findTransition(application.workflow_id, application.current_state, toState);
  if (!transition) {
    throw new UnprocessableError(`No valid transition from ${application.current_state} to ${toState}`);
  }

  const isApplicant = actingUser.system_role === 'APPLICANT';
  if (transition.required_role === 'APPLICANT') {
    if (!isApplicant || application.applicant_id !== actingUser.id) {
      throw new ForbiddenError('Only the applicant can perform this transition');
    }
  } else {
    if (isApplicant) throw new ForbiddenError('Staff role required for this transition');
    const userRoles = await workflowRepo.findUserWorkflowRoles(actingUser.id, application.workflow_id);
    if (!userRoles.includes(transition.required_role)) {
      throw new ForbiddenError(`Requires workflow role: ${transition.required_role}`);
    }
  }

  // Reviewer cannot approve
  const toStateRecord = await workflowRepo.findState(application.workflow_id, toState);
  if (toStateRecord && toStateRecord.is_terminal && application.reviewed_by === actingUser.id) {
    throw new ForbiddenError('The reviewer of an application cannot be its approver');
  }

  return transition;
}

async function getAvailableTransitions(application, actingUser) {
  const currentStateRecord = await workflowRepo.findState(application.workflow_id, application.current_state);
  if (currentStateRecord && currentStateRecord.is_terminal) return [];

  const allTransitions = await workflowRepo.findTransitions(application.workflow_id, application.current_state);
  const available = [];

  for (const t of allTransitions) {
    try {
      const isApplicant = actingUser.system_role === 'APPLICANT';
      if (t.required_role === 'APPLICANT') {
        if (isApplicant && application.applicant_id === actingUser.id) available.push(t);
      } else if (!isApplicant) {
        const userRoles = await workflowRepo.findUserWorkflowRoles(actingUser.id, application.workflow_id);
        const toStateRecord = await workflowRepo.findState(application.workflow_id, t.to_state_key);
        const isTerminal = toStateRecord && toStateRecord.is_terminal;
        if (userRoles.includes(t.required_role) && !(isTerminal && application.reviewed_by === actingUser.id)) {
          available.push(t);
        }
      }
    } catch {
      // skip transitions the user cannot take
    }
  }
  return available;
}

module.exports = { validateTransition, getAvailableTransitions };
