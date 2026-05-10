const schema = process.env.DB_SCHEMA || 'bnr_licensing';

// Schema is created by pool.afterCreate in knexfile before any connection is used.
// This migration only owns the rollback so knex migrate:rollback cleans up the schema.
exports.up = async function (_knex) {};

exports.down = async function (knex) {
  await knex.raw(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
};
