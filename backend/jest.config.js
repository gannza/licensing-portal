'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./src/tests/setup.js'],
  // Reset mock implementations between tests (superset of clearMocks).
  resetMocks: true,
  // Redirect every require of src/db/knex to the test mock so no real DB
  // connection is attempted when Jest loads modules to build auto-mocks.
  moduleNameMapper: {
    '^.+/db/knex$': '<rootDir>/src/tests/__mocks__/knex.js',
  },
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    'src/controllers/**/*.js',
  ],
  coverageReporters: ['text', 'lcov'],
};
