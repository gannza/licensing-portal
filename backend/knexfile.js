require('dotenv').config();

const schema = process.env.DB_SCHEMA || 'bnr_licensing';

const sharedConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.query(
        `CREATE SCHEMA IF NOT EXISTS "${schema}"; SET search_path TO "${schema}"`,
        (err) => done(err, conn)
      );
    },
  },
  migrations: { directory: './src/db/migrations' },
  seeds: { directory: './src/db/seeds' },
};

module.exports = {
  development: sharedConfig,
  production: sharedConfig,
};
