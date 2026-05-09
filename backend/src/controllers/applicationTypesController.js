const Joi = require('joi');
const applicationTypeRepo = require('../repositories/applicationTypeRepo');
const documentRepo = require('../repositories/documentRepo');
const { validate } = require('../utils/validate');
const { NotFoundError } = require('../utils/errors');

async function list(req, res, next) {
  try {

    const is_admin = req.user?.system_role === 'ADMIN';
    const types = await applicationTypeRepo.findAll(is_admin);
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const type = await applicationTypeRepo.findById(req.params.id);
    if (!type) throw new NotFoundError('ApplicationType');
    res.json({ success: true, data: type });
  } catch (err) { next(err); }
}


async function create(req, res, next) {
  try {
    const type = await applicationTypeRepo.createApplicationType(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const type = await applicationTypeRepo.findById(req.params.id);
    if (!type) throw new NotFoundError('ApplicationType');
    const updated = await applicationTypeRepo.updateApplicationType(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const type = await applicationTypeRepo.findById(req.params.id);
    if (!type) throw new NotFoundError('ApplicationType');
    await applicationTypeRepo.deleteApplicationType(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function createDocReq(req, res, next) {
  try {
    const type = await applicationTypeRepo.findById(req.params.typeId);
    if (!type) throw new NotFoundError('ApplicationType');
    const req_data = { ...req.body, application_type_id: req.params.typeId };
    const requirement = await documentRepo.createDocumentRequirement(req_data);
    res.status(201).json({ success: true, data: requirement });
  } catch (err) { next(err); }
}


async function updateDocReq(req, res, next) {
  try {
    const req_row = await documentRepo.findDocumentRequirementById(req.params.id);
    if (!req_row) throw new NotFoundError('DocumentRequirement');
    const updated = await documentRepo.updateDocumentRequirement(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

async function removeDocReq(req, res, next) {
  try {
    const req_row = await documentRepo.findDocumentRequirementById(req.params.id);
    if (!req_row) throw new NotFoundError('DocumentRequirement');
    await documentRepo.deleteDocumentRequirement(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
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
