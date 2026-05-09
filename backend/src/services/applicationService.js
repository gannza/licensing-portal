const { v4: uuidv4 } = require("uuid");
const applicationRepo = require("../repositories/applicationRepo");
const workflowRepo = require("../repositories/workflowRepo");
const documentRepo = require("../repositories/documentRepo");
const userRepo = require("../repositories/userRepo");
const stageDecisionRepo = require("../repositories/stageDecisionRepo");
const auditRepo = require("../repositories/auditRepo");
const stateMachineService = require("./stateMachineService");
const stageDecisionService = require("./stageDecisionService");
const auditService = require("./auditService");
const documentService = require("./documentService");
const db = require("../db/knex");
const {
  NotFoundError,
  ConflictError,
  UnprocessableError,
  ForbiddenError,
} = require("../utils/errors");

async function createApplication(applicant_id, application_type_id) {
  const workflow = await workflowRepo.findWorkflowByTypeId(application_type_id);
  if (!workflow) throw new NotFoundError("Workflow for this application type");

  const initialState = await workflowRepo.findInitialState(workflow.id);
  if (!initialState) throw new NotFoundError("Initial workflow state");

  return applicationRepo.create({
    id: uuidv4(),
    application_type_id,
    applicant_id,
    workflow_id: workflow.id,
    current_state: initialState.key,
  });
}

async function performTransition(
  application_id,
  { toState, decisionType, decisionNote },
  actingUser,
) {
  const application = await applicationRepo.findById(application_id);
  if (!application) throw new NotFoundError("Application");

  if (
    actingUser.system_role === "APPLICANT" &&
    application.applicant_id !== actingUser.id
  ) {
    throw new ForbiddenError("You do not own this application");
  }

  const transition = await stateMachineService.validateTransition(
    application,
    toState,
    actingUser,
  );

  if (transition.requires_decision) {
    if (!decisionNote || !decisionNote.trim()) {
      throw new UnprocessableError(
        "A written decision note is required for this transition",
      );
    }
  }

  if (toState === "SUBMITTED") {
    const docRequirements = await documentRepo.findDocumentRequirementByApplicationTypeId(application.application_type_id);
   
    const missing = await documentService.validateRequiredDocuments(
      application,
      docRequirements,
    );
    if (missing.length > 0) {
      throw new UnprocessableError(
        `Missing required documents: ${missing.join(", ")}`,
      );
    }
  }

  return db.transaction(async (trx) => {
    let newReviewedBy = application.reviewed_by;
    if (!newReviewedBy && actingUser.system_role === "STAFF") {
      newReviewedBy = actingUser.id;
    }

    const rowsUpdated = await trx("applications")
      .where({ id: application_id, version: application.version })
      .update({
        current_state: toState,
        version: db.raw("version + 1"),
        reviewed_by: newReviewedBy,
        updated_at: db.fn.now(),
        ...(toState === "SUBMITTED"
          ? { submitted_at: db.raw("COALESCE(submitted_at, now())") }
          : {}),
      });

    if (rowsUpdated === 0) throw new ConflictError();

    if (
      toState === "SUBMITTED" &&
      application.current_state === "PENDING_INFORMATION"
    ) {
      await trx("applications")
        .where({ id: application_id })
        .update({
          current_submission_cycle: db.raw("current_submission_cycle + 1"),
        });
    }

    let stageDecision = null;
    if (transition.requires_decision && decisionNote) {
      stageDecision = await stageDecisionService.createDecision(
        {
          application_id: application_id,
          workflow_state_key: application.current_state,
          reviewed_by: actingUser.id,
          decision_type: decisionType || "APPROVED_STAGE",
          decision_note: decisionNote,
          submission_cycle: application.current_submission_cycle,
        },
        trx,
      );
    }

    await auditService.log(
      {
        application_id: application_id,
        acting_user_id: actingUser.id,
        action: transition.requires_decision
          ? "STAGE_DECISION"
          : "STATE_TRANSITION",
        from_state: application.current_state,
        to_state: toState,
        metadata: {
          version: application.version + 1,
          decision_type: decisionType,
        },
      },
      trx,
    );

    const updated = await trx("applications")
      .where({ id: application_id })
      .first();
    return { application: updated, stage_decision: stageDecision };
  });
}

async function getTimeline(application_id ) {
  const [stateTransitions, stageDecisions] = await Promise.all([
    auditRepo.findByApplication(application_id),
    stageDecisionRepo.findByApplication(application_id),
  ]);

  const timeline = [];

  for (const at of stateTransitions.rows) {
    timeline.push({
      type: "STATE_TRANSITION",
      from_state: at.from_state,
      to_state: at.to_state,
      actor: { id: at.acting_user_id, full_name: at.actor_name },
      created_at: at.created_at,
    });
  }

  for (const sd of stageDecisions) {
    timeline.push({
      type: "STAGE_DECISION",
      stage: sd.workflow_state_key,
      decision_type: sd.decision_type,
      decision_note: sd.decision_note,
      reviewer: { id: sd.reviewed_by, full_name: sd.reviewer_name },
      cycle: sd.submission_cycle,
      created_at: sd.created_at,
    });
  }

  timeline.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return timeline;
}

async function getAllApplications(page=1, limit=20, state, workflow_id) {
  const result =  await applicationRepo.findAll({
      page,
      limit,
      state: state,
      workflow_id: workflow_id,
    });
  return {
    data: result.rows,
    pagination: { page, limit, total: result.total },
  };
}

async function getById(application_id, user_id, system_role) {

    const app = await applicationRepo.findByIdWithDetails(application_id);
    if (!app) throw new NotFoundError('Application');

    if (system_role === 'APPLICANT' && app.applicant_id !== user_id) {
      throw new ForbiddenError();
    }

    const transitions = await stateMachineService.getAvailableTransitions(app, { id: user_id, system_role });
    const docs = await documentRepo.findAllForApplication(app.id, app.current_submission_cycle);
    const currentDocs = docs.filter(d => !d.superseded_by);

    return { success: true, data: { ...app, available_transitions: transitions, documents: currentDocs } };
  
}

async function getList(page=1, limit=20, user_id, system_role) {

    if (system_role === 'APPLICANT') {
      const result = await applicationRepo.findByApplicant(user_id, { page, limit });
      return { success: true, data: result.rows, pagination: { page, limit, total: result.total } };
    }

    if (system_role === 'STAFF') {
      const userRoles = await userRepo.getUserRoles(user_id);
      if (userRoles.length === 0) {
        return { success: true, data: [], pagination: { page, limit, total: 0 } };
      }

    

      const allApps = [];
      for (const { workflow_id } of userRoles) {
        const apps = await applicationRepo.findByWorkflowRole(workflow_id, activeStates, { page: 1, limit: 100 });
        allApps.push(...apps.rows);
      }

      const seen = new Set();
      const deduped = allApps.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      return { success: true, data: deduped, pagination: { page, limit, total: deduped.length } };
    }

    const result =  await applicationRepo.findAll({ page, limit, state: req.query.state, workflow_id: req.query.workflow_id });
    return { success: true, data: result.rows, pagination: { page, limit, total: result.total } };
}

module.exports = { createApplication, performTransition, getTimeline, getAllApplications, getList, getById };
