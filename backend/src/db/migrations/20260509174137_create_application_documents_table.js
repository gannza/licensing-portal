exports.up = function (knex) {
  return knex.schema.createTable('application_documents', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('application_id').notNullable()
      .references('id').inTable('applications').onDelete('RESTRICT');
    t.text('requirement_key').notNullable();
    t.text('file_name').notNullable();
    t.integer('file_size').notNullable().checkPositive('doc_size_check');
    t.text('mime_type').notNullable();
    t.text('storage_path').notNullable();
    t.uuid('uploaded_by').notNullable().references('id').inTable('users');
    t.integer('submission_cycle').notNullable().defaultTo(1);
    t.uuid('superseded_by').references('id').inTable('application_documents');
    t.timestamp('uploaded_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['application_id', 'requirement_key', 'submission_cycle']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('application_documents');
};