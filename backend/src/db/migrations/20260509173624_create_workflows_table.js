exports.up = function (knex) {
  return knex.schema.createTable('workflows', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_type_id').notNullable()
      .references('id').inTable('application_types').onDelete('RESTRICT');
    t.text('name').notNullable();
    t.text('description');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('workflows');
};