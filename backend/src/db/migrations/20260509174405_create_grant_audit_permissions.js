exports.up = async function (knex) {
  const appUser = process.env.DB_APP_USER;
  if (appUser) {
    await knex.raw(`REVOKE UPDATE, DELETE ON audit_logs FROM "${appUser}"`);
    await knex.raw(`GRANT INSERT, SELECT ON audit_logs TO "${appUser}"`);
  }
};

exports.down = function (knex) {
  return Promise.resolve();
};