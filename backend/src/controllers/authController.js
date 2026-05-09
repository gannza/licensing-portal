const Joi = require('joi');
const authService = require('../services/authService');
const userRepo = require('../repositories/userRepo');
const { verifyRefreshToken, signAccessToken, signRefreshToken, REFRESH_EXPIRES } = require('../utils/jwt');
const { validate } = require('../utils/validate');
const { UnauthorizedError } = require('../utils/errors');
const { sanitize } = require('../services/authService');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

function setAccessCookie(res, token) {
  const ACCESS_EXPIRES = parseInt(process.env.JWT_EXPIRES_IN || '900');
  res.cookie('access_token', token, { ...cookieOptions, maxAge: ACCESS_EXPIRES * 1000 });
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, { ...cookieOptions, maxAge: REFRESH_EXPIRES * 1000 });
}

function setAuthCookies(res, { access_token, refresh_token }) {
  setAccessCookie(res, access_token);
  setRefreshCookie(res, refresh_token);
}

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result);
    if (result.must_change_password) {
      return res.json({ success: true, data: { must_change_password: true, user_id: result.user.id } });
    }
    res.json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  const token = req.cookies.refresh_token;
  if (!token) return next(new UnauthorizedError('No refresh token'));

  try {
    const payload = verifyRefreshToken(token);
    const user = await userRepo.findById(payload.sub);
    if (!user || !user.is_active) throw new UnauthorizedError('User not found or inactive');
    const newAccess = signAccessToken({ sub: user.id, system_role: user.system_role });
    const newRefresh = signRefreshToken({ sub: user.id, system_role: user.system_role });
    setAuthCookies(res, { access_token: newAccess, refresh_token: newRefresh });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  res.clearCookie('access_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  res.json({ success: true, data: { message: 'Logged out' } });
}

async function me(req, res, next) {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user || !user.is_active) throw new UnauthorizedError('User not found or inactive');
    res.json({ success: true, data: { user: sanitize(user) } });
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    setAuthCookies(res, result);
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
