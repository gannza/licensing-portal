const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    authService.setAuthCookies(res, result);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    authService.setAuthCookies(res, result);
    if (result.must_change_password) {
      return res.json({
        success: true,
        data: { must_change_password: true, user_id: result.user.id },
      });
    }
    res.json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  const token = req.cookies.refresh_token;
  const user = await authService.refresh(token);
  res.json({ success: true });
}

function logout(_req, res) {
  authService.setAuthCookies(res, { access_token: "", refresh_token: "" });
  res.json({ success: true, data: { message: "Logged out" } });
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: { user: user } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    authService.setAuthCookies(res, result);
    res.json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
  changePassword,
};
