'use strict';

// Mocks must be declared before any module that consumes them is required.
jest.mock('../../repositories/userRepo');
jest.mock('../../utils/password');
// auditRepo is called only by authService.register, which we don't exercise here.
jest.mock('../../repositories/auditRepo');
// Prevent knex from attempting a real DB connection during module initialisation.
jest.mock('../../db/knex', () => {
  const trxFn = jest.fn(() => ({ insert: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([]) }));
  trxFn.transaction = jest.fn();
  trxFn.fn = { now: jest.fn() };
  trxFn.raw = jest.fn();
  return trxFn;
});
jest.mock('../../repositories/institutionRepo', () => ({
  findByRegistrationNumber: jest.fn().mockResolvedValue(null),
}));

const request   = require('supertest');
const jwt       = require('jsonwebtoken');
const app       = require('../../app');
const userRepo  = require('../../repositories/userRepo');
const { verifyPassword } = require('../../utils/password');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser = {
  id:                   'user-uuid-123',
  email:                'test@bnr.rw',
  password_hash:        '$2a$10$placeholder_hash',
  full_name:            'Test User',
  system_role:          'APPLICANT',
  is_active:            true,
  must_change_password: false,
  last_login_at:        null,
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    userRepo.findByEmail.mockResolvedValue(mockUser);
    userRepo.updateLastLogin.mockResolvedValue(undefined);
    verifyPassword.mockResolvedValue(true);
  });

  it('returns 200 and sets httpOnly auth cookies on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw', password: 'Test1234!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.password_hash).toBeUndefined(); // never leak hash

    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    // Cookies must be HttpOnly
    expect(cookies.every((c) => c.toLowerCase().includes('httponly'))).toBe(true);
  });

  it('returns 401 for an unknown email address', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@bnr.rw', password: 'Test1234!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a wrong password', async () => {
    verifyPassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw', password: 'WrongPass1!' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for an inactive account', async () => {
    userRepo.findByEmail.mockResolvedValue({ ...mockUser, is_active: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw', password: 'Test1234!' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for a malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Test1234!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the password field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw' });

    expect(res.status).toBe(400);
  });

  it('returns must_change_password:true and user_id when the flag is set', async () => {
    userRepo.findByEmail.mockResolvedValue({ ...mockUser, must_change_password: true });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw', password: 'Test1234!' });

    expect(res.status).toBe(200);
    expect(res.body.data.must_change_password).toBe(true);
    expect(res.body.data.user_id).toBe(mockUser.id);
    // user object should NOT be present in this variant
    expect(res.body.data.user).toBeUndefined();
  });

  it('still sets auth cookies even when must_change_password is true', async () => {
    userRepo.findByEmail.mockResolvedValue({ ...mockUser, must_change_password: true });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@bnr.rw', password: 'Test1234!' });

    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
  });
});

// POST /api/auth/refresh

describe('POST /api/auth/refresh', () => {
  it('returns 200 and issues fresh auth cookies with a valid refresh token', async () => {
    userRepo.findById.mockResolvedValue(mockUser);

    const refreshToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      REFRESH_SECRET,
      { expiresIn: 3600 },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('returns 401 when no refresh token cookie is sent', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired refresh token', async () => {
    const expiredToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      REFRESH_SECRET,
      { expiresIn: -1 }, // already expired
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const badToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      'wrong-secret',
      { expiresIn: 3600 },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${badToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user is no longer active', async () => {
    userRepo.findById.mockResolvedValue({ ...mockUser, is_active: false });

    const refreshToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      REFRESH_SECRET,
      { expiresIn: 3600 },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    userRepo.findById.mockResolvedValue(null);

    const refreshToken = jwt.sign(
      { sub: 'deleted-user-id', system_role: 'APPLICANT' },
      REFRESH_SECRET,
      { expiresIn: 3600 },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`);

    expect(res.status).toBe(401);
  });
});

// POST /api/auth/logout

describe('POST /api/auth/logout', () => {
  it('returns 200 with a success message', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('clears both auth cookies in the response', async () => {
    const res = await request(app).post('/api/auth/logout');

    const cookies = res.headers['set-cookie'] ?? [];
    // After clearing, the cookie value should be empty or maxAge should be zero/negative
    const accessCookie  = cookies.find((c) => c.includes('access_token='));
    const refreshCookie = cookies.find((c) => c.includes('refresh_token='));

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    // Cleared cookies are sent with an empty value and an expires in the past
    expect(accessCookie).toMatch(/access_token=;|access_token=(?:;| )/);
  });

  it('succeeds even when no cookies were sent', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', '');

    expect(res.status).toBe(200);
  });
});

// GET /api/auth/me — expired-token guard

describe('GET /api/auth/me', () => {
  it('returns 401 when no access token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired access token', async () => {
    const expiredToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      ACCESS_SECRET,
      { expiresIn: -1 },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `access_token=${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const badToken = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      'wrong-secret',
      { expiresIn: 900 },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `access_token=${badToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 200 with user data for a valid access token', async () => {
    userRepo.findById.mockResolvedValue(mockUser);

    const token = jwt.sign(
      { sub: mockUser.id, system_role: mockUser.system_role },
      ACCESS_SECRET,
      { expiresIn: 900 },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(mockUser.id);
    expect(res.body.data.user.password_hash).toBeUndefined();
  });
});
