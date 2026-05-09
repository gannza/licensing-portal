const documentService = require('../services/documentService');
const documentRepo = require('../repositories/documentRepo');
const applicationRepo = require('../repositories/applicationRepo');
const auditService = require('../services/auditService');
const { NotFoundError, ForbiddenError, UnprocessableError } = require('../utils/errors');
const db = require('../db/knex');

async function upload(req, res, next) {
  try {
    if (!req.file) throw new UnprocessableError('No file uploaded');

    const app = await applicationRepo.findById(req.params.id);
    if (!app) throw new NotFoundError('Application');

    if (req.user.system_role !== 'APPLICANT' || app.applicant_id !== req.user.id) {
      throw new ForbiddenError('Only the applicant can upload documents');
    }

    if (!['DRAFT', 'PENDING_INFORMATION'].includes(app.current_state)) {
      throw new UnprocessableError('Documents can only be uploaded when the application is in DRAFT or PENDING_INFORMATION state');
    }

    const requirement = await db('document_requirements')
      .where({ application_type_id: app.application_type_id, key: req.params.requirementKey })
      .first();

    if (!requirement) throw new NotFoundError('Document requirement');

    const doc = await documentService.uploadDocument({
      application: app,
      requirement,
      file: req.file,
      uploadedBy: req.user.id,
    });

    await auditService.log({
      application_id: app.id,
      acting_user_id: req.user.id,
      action: 'DOCUMENT_UPLOAD',
      metadata: { requirement_key: req.params.requirementKey, file_name: req.file.originalname },
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const app = await applicationRepo.findById(req.params.id);
    if (!app) throw new NotFoundError('Application');

    if (req.user.system_role === 'APPLICANT' && app.applicant_id !== req.user.id) {
      throw new ForbiddenError();
    }

    const cycle = parseInt(req.query.cycle) || app.current_submission_cycle;
    const docs = await documentService.getDocumentsForCycle(app.id, cycle);
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const app = await applicationRepo.findById(req.params.id);
    if (!app) throw new NotFoundError('Application');

    if (req.user.system_role === 'APPLICANT' && app.applicant_id !== req.user.id) {
      throw new ForbiddenError();
    }

    const history = await documentRepo.findHistory(app.id, req.params.requirementKey);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
}

module.exports = { upload, list, getHistory };
