const { v4: uuidv4 } = require('uuid');
const documentRepo = require('../repositories/documentRepo');
const auditService = require('./auditService');
const applicationRepo = require('../repositories/applicationRepo');
const { NotFoundError, ValidationError, UnprocessableError, ForbiddenError } = require('../utils/errors');
const db = require('../db/knex');

async function uploadDocument({ application, requirement, file, uploadedBy }) {
  if (!requirement) throw new NotFoundError('Document requirement');

  if (requirement.allowed_mime_types && requirement.allowed_mime_types.length > 0) {
    const allowed = Array.isArray(requirement.allowed_mime_types)
      ? requirement.allowed_mime_types
      : requirement.allowed_mime_types.replace(/[{}]/g, '').split(',');
    if (!allowed.includes(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} is not allowed for this requirement`);
    }
  }

  return db.transaction(async (trx) => {
    const existing = await documentRepo.findLatestForCycle(application.id, requirement.key, application.current_submission_cycle);

    const doc = await documentRepo.create({
      id: uuidv4(),
      application_id: application.id,
      requirement_key: requirement.key,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      storage_path: file.path,
      uploaded_by: uploadedBy,
      submission_cycle: application.current_submission_cycle,
    }, trx);

    if (existing) {
      await documentRepo.markSuperseded(existing.id, doc.id, trx);
    }

    return doc;
  });
}

async function getDocumentsForCycle(application_id, submission_cycle) {
  const docs = await documentRepo.findAllForApplication(application_id, submission_cycle);
  return docs.filter(d => !d.superseded_by);
}

async function validateRequiredDocuments(application, documentRequirements) {
  const docs = await getDocumentsForCycle(application.id, application.current_submission_cycle);
  const uploadedKeys = new Set(docs.map(d => d.requirement_key));
  const missing = documentRequirements
    .filter(r => r.is_required && !uploadedKeys.has(r.key))
    .map(r => r.label);
  return missing;
}

async function upload(file, application_id, requirement_key, uploaded_by,system_role) {

    if (!file) throw new UnprocessableError('No file uploaded');

    const app = await applicationRepo.findById(application_id);
    if (!app) throw new NotFoundError('Application');

    if (system_role !== 'APPLICANT' || app.applicant_id !== uploaded_by) {
      throw new ForbiddenError('Only the applicant can upload documents');
    }

    if (!['DRAFT', 'PENDING_INFORMATION'].includes(app.current_state)) {
      throw new UnprocessableError('Documents can only be uploaded when the application is in DRAFT or PENDING_INFORMATION state');
    }

    const requirement = await db('document_requirements')
      .where({ application_type_id: app.application_type_id, key: requirement_key })
      .first();

    if (!requirement) throw new NotFoundError('Document requirement');

    const doc = await uploadDocument({
      application: app,
      requirement,
      file: file,
      uploadedBy: uploaded_by,
    });

    await auditService.log({
      application_id: app.id,
      acting_user_id: uploaded_by,
      action: 'DOCUMENT_UPLOAD',
      metadata: { requirement_key: requirement_key, file_name: file.originalname },
    });
    return doc;
}


async function list(application_id, user_id, system_role, submission_cycle) {
    const app = await applicationRepo.findById(application_id);
    if (!app) throw new NotFoundError("Application");

    if (
      system_role === "APPLICANT" &&
      app.applicant_id !== user_id
    ) {
      throw new ForbiddenError();
    }

    const cycle = parseInt(submission_cycle) || app.current_submission_cycle;
    const docs = await documentService.getDocumentsForCycle(app.id, cycle);
    return docs;
}

async function getHistory(application_id, user_id, system_role, requirement_key) {
    const app = await applicationRepo.findById(application_id);
    if (!app) throw new NotFoundError("Application");

    if (
      system_role === "APPLICANT" &&
      app.applicant_id !== user_id
    ) {
      throw new ForbiddenError();
    }

    const history = await documentRepo.findHistory(
      app.id,
      requirement_key,
    );
    return history;
}

module.exports = { uploadDocument, getDocumentsForCycle, validateRequiredDocuments, upload, list, getHistory };
