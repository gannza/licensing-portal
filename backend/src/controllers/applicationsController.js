const Joi = require('joi');
const applicationService = require('../services/applicationService');
const applicationRepo = require('../repositories/applicationRepo');
const documentRepo = require('../repositories/documentRepo');
const stageDecisionRepo = require('../repositories/stageDecisionRepo');
const workflowRepo = require('../repositories/workflowRepo');
const stateMachineService = require('../services/stateMachineService');


const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { activeStates } = require('../constant');

async function create(req, res, next) {
  try {
    const app = await applicationService.createApplication(req.user.id, req.body.application_type_id);
    res.status(201).json({ success: true, data: app });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await applicationService.getList(page, limit, req.user.id, req.user.system_role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await applicationService.getById(req.params.id, req.user.id, req.user.system_role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function stageDecision(req, res, next) {
  try {
    const result = await applicationService.performTransition(req.params.id, {
      toState: req.body.toState,
      decisionType: req.body.decisionType,
      decisionNote: req.body.decisionNote,
    }, req.user);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function getTimeline(req, res, next) {
  try {
    const app = await applicationRepo.findById(req.params.id);
    if (!app) throw new NotFoundError('Application');

    if (req.user.system_role === 'APPLICANT' && app.applicant_id !== req.user.id) {
      throw new ForbiddenError();
    }

    const [timeline, workflowStates] = await Promise.all([
      applicationService.getTimeline(req.params.id),
      workflowRepo.findWorkflowStates(app.workflow_id),
    ]);
    res.json({ success: true, data: { timeline, workflow_states: workflowStates } });
  } catch (err) { next(err); }
}

async function getStageDecisions(req, res, next) {
  try {
    const app = await applicationRepo.findById(req.params.id);
    if (!app) throw new NotFoundError('Application');

    if (req.user.system_role === 'APPLICANT' && app.applicant_id !== req.user.id) {
      throw new ForbiddenError();
    }

    const decisions = await stageDecisionRepo.findByApplication(req.params.id);
    res.json({ success: true, data: decisions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  stageDecision,
  getTimeline,
  getStageDecisions,
};
