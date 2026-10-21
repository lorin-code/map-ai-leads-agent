const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function normalizeLevel(level) {
  const value = String(level || 'info').toLowerCase();
  return LEVELS[value] ? value : 'info';
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    cause:
      error.cause && typeof error.cause === 'object'
        ? {
            message: error.cause.message,
            code: error.cause.code,
            hostname: error.cause.hostname,
          }
        : undefined,
  };
}

function createLogger({ level = process.env.LOG_LEVEL || 'info', context = {} } = {}) {
  const normalizedLevel = normalizeLevel(level);

  function emit(eventLevel, message, fields = {}) {
    if (LEVELS[eventLevel] < LEVELS[normalizedLevel]) {
      return;
    }

    const payload = {
      ts: new Date().toISOString(),
      level: eventLevel,
      msg: message,
      ...context,
      ...fields,
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }

  return {
    child(fields = {}) {
      return createLogger({
        level: normalizedLevel,
        context: { ...context, ...fields },
      });
    },
    debug(message, fields) {
      emit('debug', message, fields);
    },
    info(message, fields) {
      emit('info', message, fields);
    },
    warn(message, fields) {
      emit('warn', message, fields);
    },
    error(message, fields) {
      emit('error', message, {
        ...fields,
        error: serializeError(fields?.error),
      });
    },
  };
}

module.exports = {
  createLogger,
};
