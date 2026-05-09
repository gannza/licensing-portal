exports.up = function (knex) {
  return knex.schema.createTable('workflow_transitions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workflow_id').notNullable()
      .references('id').inTable('workflows').onDelete('CASCADE');
    t.text('from_state_key').notNullable();
    t.text('to_state_key').notNullable();
    t.text('required_role').notNullable()
      .checkIn(['APPLICANT','INTAKE_OFFICER','REVIEWER','LEGAL_OFFICER','FINANCIAL_OFFICER','APPROVER'], 'wt_role_check');
    t.boolean('requires_decision').notNullable().defaultTo(false);
    t.text('label');
    t.unique(['workflow_id', 'from_state_key', 'to_state_key']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('workflow_transitions');
};