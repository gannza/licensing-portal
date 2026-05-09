const { v4: uuidv4 } = require('uuid');
const documentRepo = require('../repositories/documentRepo');
const { NotFoundError, ValidationError } = require('../utils/errors');
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

module.exports = { uploadDocument, getDocumentsForCycle, validateRequiredDocuments };
