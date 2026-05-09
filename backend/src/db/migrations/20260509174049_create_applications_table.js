exports.up = function (knex) {
  return knex.schema.createTable('applications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_type_id').notNullable()
      .references('id').inTable('application_types');
    t.uuid('applicant_id').notNullable()
      .references('id').inTable('users');
    t.uuid('workflow_id').notNullable()
      .references('id').inTable('workflows');
    t.text('current_state').notNullable();
    t.uuid('reviewed_by').references('id').inTable('users');
    t.integer('version').notNullable().defaultTo(1);
    t.integer('current_submission_cycle').notNullable().defaultTo(1);
    t.timestamp('submitted_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['applicant_id']);
    t.index(['current_state', 'workflow_id']);
    t.index(['application_type_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('applications');
};