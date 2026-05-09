exports.up = function (knex) {
  return knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('email').notNullable().unique();
    t.text('password_hash').notNullable();
    t.text('full_name').notNullable();
    t.text('phone');
    t.text('system_role').notNullable()
      .checkIn(['APPLICANT', 'STAFF', 'ADMIN'], 'users_system_role_check');
    t.boolean('must_change_password').notNullable().defaultTo(false);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_login_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};