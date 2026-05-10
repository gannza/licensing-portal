const applicationTypeService = require("../services/applicationTypeService");

async function list(req, res, next) {
  try {
    const system_role = req.user ? req.user.system_role : null;
    const types = await applicationTypeService.list(system_role);
    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const type = await applicationTypeService.getOne(req.params.id);
    res.json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const type = await applicationTypeService.create(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const updated = await applicationTypeService.update(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await applicationTypeService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function createDocReq(req, res, next) {
  try {
    const requirement = await applicationTypeService.createDocReq(
      req.params.typeId,
      req.body,
    );
    res.status(201).json({ success: true, data: requirement });
  } catch (err) {
    next(err);
  }
}

async function updateDocReq(req, res, next) {
  try {
    const req_row = await applicationTypeService.updateDocReq(
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: req_row });
  } catch (err) {
    next(err);
  }
}

async function removeDocReq(req, res, next) {
  try {
    const req_row = await applicationTypeService.removeDocReq(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
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
