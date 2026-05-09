exports.up = function (knex) {
  return knex.schema.createTable('institutions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('applicant_user_id').notNullable().unique()
      .references('id').inTable('users').onDelete('RESTRICT');
    t.text('name').notNullable();
    t.text('registration_number').notNullable().unique();
    t.text('phone');
    t.text('address');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('institutions');
};
