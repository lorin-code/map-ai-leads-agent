const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SQLITE_PATH = path.join(PROJECT_ROOT, 'data', 'app.db');

function resolveDbPath(dbPath = process.env.SQLITE_PATH || DEFAULT_SQLITE_PATH) {
  if (dbPath === ':memory:' || path.isAbsolute(dbPath)) {
    return dbPath;
  }

  return path.resolve(PROJECT_ROOT, dbPath);
}

module.exports = {
  DEFAULT_SQLITE_PATH,
  PROJECT_ROOT,
  resolveDbPath,
};
