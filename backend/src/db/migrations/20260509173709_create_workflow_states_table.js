exports.up = function (knex) {
  return knex.schema.createTable('workflow_states', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workflow_id').notNullable()
      .references('id').inTable('workflows').onDelete('CASCADE');
    t.text('key').notNullable();
    t.text('label').notNullable();
    t.boolean('is_initial').notNullable().defaultTo(false);
    t.boolean('is_terminal').notNullable().defaultTo(false);
    t.boolean('is_approved').notNullable().defaultTo(false);
    t.integer('display_order').notNullable().defaultTo(0);
    t.unique(['workflow_id', 'key']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('workflow_states');
};