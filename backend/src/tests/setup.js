// Set env vars before any module loads so JWT utilities and dotenv pick them up.
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-unit-tests-only';
process.env.JWT_EXPIRES_IN = '900';
process.env.JWT_REFRESH_EXPIRES_IN = '604800';
process.env.NODE_ENV = 'test';
