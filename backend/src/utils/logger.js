const pid = process.pid;

function fmt(level, reqId, args) {
  const ts = new Date().toISOString();
  const prefix = reqId ? `[${reqId}]` : '';
  process[level === 'error' ? 'stderr' : 'stdout'].write(
    `${ts} ${level.toUpperCase().padEnd(5)}(${pid}) ${prefix} ${args.map(a =>
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ')}\n`
  );
}

const logger = {
  info:  (...args) => fmt('info',  null, args),
  warn:  (...args) => fmt('warn',  null, args),
  error: (...args) => fmt('error', null, args),
  child: (reqId) => ({
    info:  (...args) => fmt('info',  reqId, args),
    warn:  (...args) => fmt('warn',  reqId, args),
    error: (...args) => fmt('error', reqId, args),
  }),
};

module.exports = { logger };
