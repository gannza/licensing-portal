const app = require('./app');
const db = require('./db/knex');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const ENV  = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  logger.info(`Portal API on :${PORT} [${ENV}]`);
});

function shutdown(signal) {
  logger.info(`${signal} — shutting down`);
  server.close(async () => {
    try {
      await db.destroy();
    } catch (error) {
      logger.error('Error occurred while destroying database connection:', error);
     }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});
