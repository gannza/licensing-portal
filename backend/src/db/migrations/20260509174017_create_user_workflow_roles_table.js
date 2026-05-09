exports.up = function (knex) {
  return knex.schema.createTable('user_workflow_roles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.uuid('workflow_id').notNullable()
      .references('id').inTable('workflows').onDelete('CASCADE');
    t.text('role').notNullable()
      .checkIn(['INTAKE_OFFICER','REVIEWER','LEGAL_OFFICER','FINANCIAL_OFFICER','APPROVER'], 'uwr_role_check');
    t.uuid('assigned_by').notNullable()
      .references('id').inTable('users');
    t.timestamp('assigned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['user_id', 'workflow_id', 'role']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('user_workflow_roles');
};