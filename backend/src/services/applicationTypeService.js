const { v4: uuidv4 } = require("uuid");
const applicationTypeRepo = require("../repositories/applicationTypeRepo");
const documentRepo = require("../repositories/documentRepo");
const {
  NotFoundError,
  ConflictError,
  UnprocessableError,
  ForbiddenError,
} = require("../utils/errors");

async function list(system_role) {
  const is_admin = system_role === "ADMIN";
  const types = await applicationTypeRepo.findAll(is_admin);
  return types;
}

async function getOne(application_type_id) {
  const type = await applicationTypeRepo.findById(application_type_id);
  if (!type) throw new NotFoundError("ApplicationType");
  return type;
}
async function create(body) {
  const type = await applicationTypeRepo.createApplicationType(body);
  return type;
}

async function update(application_type_id, body) {
  const type = await applicationTypeRepo.findById(application_type_id);
  if (!type) throw new NotFoundError("ApplicationType");
  const updated = await applicationTypeRepo.updateApplicationType(
    application_type_id,
    body,
  );
  return updated;
}

async function remove(application_type_id) {
  const type = await applicationTypeRepo.findById(application_type_id);
  if (!type) throw new NotFoundError("ApplicationType");
  await applicationTypeRepo.deleteApplicationType(application_type_id);
  return { success: true };
}

async function createDocReq(type_id, body) {
  const type = await applicationTypeRepo.findById(type_id);
  if (!type) throw new NotFoundError("ApplicationType");
  const req_data = { ...body, application_type_id: type_id };
  const requirement = await documentRepo.createDocumentRequirement(req_data);
  return requirement;
}

async function updateDocReq(requirement_id, body) {
  const req_row =
    await documentRepo.findDocumentRequirementById(requirement_id);
  if (!req_row) throw new NotFoundError("DocumentRequirement");
  const updated = await documentRepo.updateDocumentRequirement(
    requirement_id,
    body,
  );
  return updated;
}
async function removeDocReq(requirement_id) {
  const req_row =
    await documentRepo.findDocumentRequirementById(requirement_id);
  if (!req_row) throw new NotFoundError("DocumentRequirement");
  await documentRepo.deleteDocumentRequirement(requirement_id);
  return true;
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  createDocReq,
  updateDocReq,
  removeDocReq,
};
