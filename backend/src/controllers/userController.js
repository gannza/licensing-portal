const userService = require("../services/userService");

async function createUser(req, res, next) {
  try {
    const result = await userService.createStaffUser(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await userService.listUsers(page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getUserWorkflowRoles(req, res, next) {
  try {
    const user = await userService.getUserWorkflowRoles(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    const updated = await userService.updateUserStatus(
      req.params.id,
      is_active,
      req.user.id,
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createUser,
  listUsers,
  getUserWorkflowRoles,
  updateUserStatus,
};
