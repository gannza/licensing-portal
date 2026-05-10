exports.up = function (knex) {
  return knex.schema.createTable('application_stage_reviews', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_id').notNullable()
      .references('id').inTable('applications');
    t.text('workflow_state_key').notNullable();
    t.uuid('reviewed_by').notNullable().references('id').inTable('users');
    t.text('decision_type').notNullable()
      .checkIn(['APPROVED_STAGE','REQUEST_INFO'], 'asr_decision_type_check');
    t.text('decision_note').notNullable();
    t.integer('submission_cycle').notNullable().defaultTo(1);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['application_id', 'workflow_state_key', 'reviewed_by', 'submission_cycle']);
    t.index(['application_id', 'workflow_state_key', 'submission_cycle']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('application_stage_reviews');
};