exports.up = async function (knex) {
  const appUser = process.env.DB_USER || "postgres";
  const schema = process.env.DB_SCHEMA || "bnr_licensing";

  await knex.raw(`REVOKE ALL ON ${schema}.audit_logs FROM PUBLIC`);
  await knex.raw(`REVOKE ALL ON ${schema}.audit_logs FROM "${appUser}"`);
  await knex.raw(`GRANT SELECT, INSERT ON ${schema}.audit_logs TO "${appUser}"`);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION ${schema}.prevent_audit_logs_modification()
    RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs is immutable';
    END;
    $$ LANGUAGE plpgsql
  `);

  // Blocks UPDATE and DELETE (row-level), fires even for the table owner
  await knex.raw(`
    CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE OR DELETE ON ${schema}.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION ${schema}.prevent_audit_logs_modification()
  `);

  // Blocks TRUNCATE separately — row-level triggers do not fire for TRUNCATE
  await knex.raw(`
    CREATE TRIGGER audit_logs_no_truncate
    BEFORE TRUNCATE ON ${schema}.audit_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION ${schema}.prevent_audit_logs_modification()
  `);
};

exports.down = async function (knex) {
  const appUser = process.env.DB_USER || "postgres";
  const schema = process.env.DB_SCHEMA || "bnr_licensing";

  await knex.raw(`DROP TRIGGER IF EXISTS audit_logs_no_truncate ON ${schema}.audit_logs`);
  await knex.raw(`DROP TRIGGER IF EXISTS audit_logs_no_update ON ${schema}.audit_logs`);
  await knex.raw(`DROP FUNCTION IF EXISTS ${schema}.prevent_audit_logs_modification()`);

  await knex.raw(`GRANT ALL ON ${schema}.audit_logs TO "${appUser}"`);
};
