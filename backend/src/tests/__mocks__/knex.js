'use strict';
/**
 * Global knex mock — loaded by moduleNameMapper for every test file.
 * All repos that do require('../db/knex') receive this instead of the real
 * knex instance, so no DB connection is ever attempted in tests.
 */

const makeQueryBuilder = () => ({
  where:     jest.fn().mockReturnThis(),
  whereIn:   jest.fn().mockReturnThis(),
  update:    jest.fn().mockResolvedValue(0),
  first:     jest.fn().mockResolvedValue(null),
  insert:    jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
  count:     jest.fn().mockResolvedValue([{ count: '0' }]),
  orderBy:   jest.fn().mockReturnThis(),
  limit:     jest.fn().mockReturnThis(),
  offset:    jest.fn().mockReturnThis(),
  join:      jest.fn().mockReturnThis(),
  leftJoin:  jest.fn().mockReturnThis(),
  select:    jest.fn().mockReturnThis(),
  pluck:     jest.fn().mockResolvedValue([]),
  modify:    jest.fn().mockReturnThis(),
});

const db = jest.fn(makeQueryBuilder);
db.transaction = jest.fn();
db.raw = jest.fn().mockReturnValue('MOCK_RAW');
db.fn  = { now: jest.fn().mockReturnValue('MOCK_NOW') };

module.exports = db;
