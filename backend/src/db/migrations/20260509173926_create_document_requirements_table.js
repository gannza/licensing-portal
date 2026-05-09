exports.up = function (knex) {
  return knex.schema.createTable('document_requirements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_type_id').notNullable()
      .references('id').inTable('application_types').onDelete('CASCADE');
    t.text('key').notNullable();
    t.text('label').notNullable();
    t.text('description');
    t.boolean('is_required').notNullable().defaultTo(true);
    t.specificType('allowed_mime_types', 'TEXT[]');
    t.integer('max_size_bytes').defaultTo(5242880);
    t.integer('display_order').notNullable().defaultTo(0);
    t.unique(['application_type_id', 'key']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('document_requirements');
};