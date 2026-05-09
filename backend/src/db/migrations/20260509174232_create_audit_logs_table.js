exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_id').references('id').inTable('applications');
    t.uuid('acting_user_id').notNullable().references('id').inTable('users');
    t.text('action').notNullable();
    t.text('from_state');
    t.text('to_state');
    t.jsonb('metadata');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['application_id', 'created_at']);
    t.index(['acting_user_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('audit_logs');
};